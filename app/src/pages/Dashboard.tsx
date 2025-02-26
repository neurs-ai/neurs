import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program, Provider } from '@project-serum/anchor';

const Dashboard: React.FC = () => {
  const { publicKey, wallet } = useWallet();
  const [agentCount, setAgentCount] = useState<number>(0);
  const [taskCount, setTaskCount] = useState<number>(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!publicKey || !wallet) return;

      try {
        // Initialize connection to the Zenith program
        const provider = new Provider(
          wallet as any,
          'https://api.devnet.solana.com'
        );
        const program = new Program(
          require('../idl/zenith.json'),
          'your_program_id',
          provider
        );

        // Fetch statistics
        const agents = await program.account.agentAccount.all();
        const tasks = await program.account.taskAccount.all();

        setAgentCount(agents.length);
        setTaskCount(tasks.length);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [publicKey, wallet]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <WalletMultiButton />
      </div>

      {publicKey ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Active Agents</h2>
            <p className="text-3xl font-bold text-indigo-500">{agentCount}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Total Tasks</h2>
            <p className="text-3xl font-bold text-indigo-500">{taskCount}</p>
          </div>
          <div className="md:col-span-2 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {/* Add recent activity items here */}
              <p className="text-gray-400">No recent activity</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">
            Connect your wallet to get started
          </h2>
          <p className="text-gray-400 mb-6">
            Use a Solana wallet to interact with Zenith agents
          </p>
          <WalletMultiButton />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
