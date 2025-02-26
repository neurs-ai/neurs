use anchor_lang::prelude::*;

declare_id!("your_program_id");

#[program]
pub mod zenith {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let agent_account = &mut ctx.accounts.agent_account;
        agent_account.is_active = true;
        agent_account.tasks_completed = 0;
        Ok(())
    }

    pub fn create_task(ctx: Context<CreateTask>, task_data: String) -> Result<()> {
        let task_account = &mut ctx.accounts.task_account;
        let agent_account = &mut ctx.accounts.agent_account;

        task_account.data = task_data;
        task_account.completed = false;
        task_account.agent = agent_account.key();

        Ok(())
    }

    pub fn complete_task(ctx: Context<CompleteTask>, result: String) -> Result<()> {
        let task_account = &mut ctx.accounts.task_account;
        let agent_account = &mut ctx.accounts.agent_account;

        task_account.completed = true;
        task_account.result = result;
        agent_account.tasks_completed += 1;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8 + 1)]
    pub agent_account: Account<'info, AgentAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateTask<'info> {
    #[account(init, payer = user, space = 8 + 32 + 200 + 1 + 200)]
    pub task_account: Account<'info, TaskAccount>,
    #[account(mut)]
    pub agent_account: Account<'info, AgentAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteTask<'info> {
    #[account(mut)]
    pub task_account: Account<'info, TaskAccount>,
    #[account(mut)]
    pub agent_account: Account<'info, AgentAccount>,
    pub user: Signer<'info>,
}

#[account]
pub struct AgentAccount {
    pub is_active: bool,
    pub tasks_completed: u64,
}

#[account]
pub struct TaskAccount {
    pub agent: Pubkey,
    pub data: String,
    pub completed: bool,
    pub result: String,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Task is already completed")]
    TaskAlreadyCompleted,
    #[msg("Agent is not active")]
    AgentNotActive,
}
