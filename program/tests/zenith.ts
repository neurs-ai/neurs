import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Zenith } from "../target/types/zenith";
import { expect } from "chai";

describe("zenith", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Zenith as Program<Zenith>;

  it("Can initialize agent account", async () => {
    const agentAccount = anchor.web3.Keypair.generate();

    await program.methods
      .initialize()
      .accounts({
        agentAccount: agentAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([agentAccount])
      .rpc();

    const account = await program.account.agentAccount.fetch(
      agentAccount.publicKey
    );

    expect(account.isActive).to.be.true;
    expect(account.tasksCompleted.toNumber()).to.equal(0);
  });

  it("Can create and complete task", async () => {
    const agentAccount = anchor.web3.Keypair.generate();
    const taskAccount = anchor.web3.Keypair.generate();

    // Initialize agent
    await program.methods
      .initialize()
      .accounts({
        agentAccount: agentAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([agentAccount])
      .rpc();

    // Create task
    const taskData = "Analyze market sentiment";
    await program.methods
      .createTask(taskData)
      .accounts({
        taskAccount: taskAccount.publicKey,
        agentAccount: agentAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([taskAccount])
      .rpc();

    let task = await program.account.taskAccount.fetch(taskAccount.publicKey);
    expect(task.data).to.equal(taskData);
    expect(task.completed).to.be.false;

    // Complete task
    const result = "Positive sentiment detected";
    await program.methods
      .completeTask(result)
      .accounts({
        taskAccount: taskAccount.publicKey,
        agentAccount: agentAccount.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    task = await program.account.taskAccount.fetch(taskAccount.publicKey);
    expect(task.completed).to.be.true;
    expect(task.result).to.equal(result);

    const agent = await program.account.agentAccount.fetch(
      agentAccount.publicKey
    );
    expect(agent.tasksCompleted.toNumber()).to.equal(1);
  });
});
