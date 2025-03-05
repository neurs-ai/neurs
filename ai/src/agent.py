from typing import Dict, Any
import asyncio
from solana.rpc.async_api import AsyncClient
from solana.keypair import Keypair
from anchorpy import Program, Provider, Wallet
from langchain import LLMChain, OpenAI
from langchain.prompts import PromptTemplate


class ZenithAgent:
    def __init__(self, program: Program, wallet: Wallet):
        self.program = program
        self.wallet = wallet
        self.llm = OpenAI(temperature=0.7)
        self.task_chain = self._create_task_chain()
 
    def _create_task_chain(self) -> LLMChain:
        prompt = PromptTemplate(
            input_variables=["task"],
            template="""
            As an AI agent on the Solana blockchain, analyze and execute the following task:
            {task}
            
            Provide your response in the following format:
            1. Analysis: [Your understanding of the task]
            2. Approach: [Your strategy to complete the task]
            3. Result: [The outcome or solution]
            """
        )
        return LLMChain(llm=self.llm, prompt=prompt)

    async def create_agent_account(self) -> str:
        """Initialize a new agent account on Solana"""
        keypair = Keypair()
        tx = await self.program.rpc["initialize"](
            ctx=self.program.context.accounts({
                "agent_account": keypair.public_key,
                "user": self.wallet.public_key,
                "system_program": self.program.context.system_program_id,
            })
        )
        return str(keypair.public_key)

    async def create_task(self, task_data: str) -> str:
        """Create a new task on Solana"""
        task_keypair = Keypair()
        tx = await self.program.rpc["create_task"](
            task_data,
            ctx=self.program.context.accounts({
                "task_account": task_keypair.public_key,
                "agent_account": self.wallet.public_key,
                "user": self.wallet.public_key,
                "system_program": self.program.context.system_program_id,
            })
        )
        return str(task_keypair.public_key)

    async def execute_task(self, task_data: str) -> Dict[str, Any]:
        """Execute a task using AI and record result on Solana"""
        # Process task with LLM
        result = await self.task_chain.apredict(task=task_data)
        
        # Create task on Solana
        task_address = await self.create_task(task_data)
        
        # Complete task with result
        tx = await self.program.rpc["complete_task"](
            result,
            ctx=self.program.context.accounts({
                "task_account": task_address,
                "agent_account": self.wallet.public_key,
                "user": self.wallet.public_key,
            })
        )
        
        return {
            "task_address": task_address,
            "result": result,
            "transaction": tx
        }

async def main():
    # Initialize Solana connection
    client = AsyncClient("http://localhost:8899")
    provider = Provider(client, Wallet.local())
    
    # Load the Zenith program
    program = await Program.at("your_program_id", provider)
    
    # Create agent
    agent = ZenithAgent(program, provider.wallet)
    
    # Example task execution
    result = await agent.execute_task(
        "Analyze the current market sentiment for Solana using social media data"
    )
    print(f"Task executed: {result}")

if __name__ == "__main__":
    asyncio.run(main())
