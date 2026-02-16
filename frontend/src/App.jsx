import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import contractData from './SimpleEscrow.json'

function App() {
  const [account, setAccount] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  
  // Для создания нового escrow
  const [developerAddress, setDeveloperAddress] = useState('')
  const [projectBudget, setProjectBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [newContractAddress, setNewContractAddress] = useState('')
  
  // Для взаимодействия с существующим контрактом
  const [contractInfo, setContractInfo] = useState(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  async function connectWallet() {
    if (!window.ethereum) {
      alert('Установите MetaMask!')
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    try {
      setIsConnecting(true)
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      setAccount(accounts[0])
      console.log('Подключен:', accounts[0])
    } catch (error) {
      console.error('Ошибка подключения:', error)
      alert('Не удалось подключить кошелек')
    } finally {
      setIsConnecting(false)
    }
  }

  async function loadContractInfo() {
    if (!window.ethereum || !contractData.address) return
    
    try {
      setLoadingInfo(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(
        contractData.address,
        contractData.abi,
        provider
      )
      
      const [client, developer, amount, isCompleted, isRefunded] = await contract.getStatus()
      
      setContractInfo({
        address: contractData.address,
        client,
        developer,
        amount: ethers.formatEther(amount),
        isCompleted,
        isRefunded
      })
    } catch (error) {
      console.error('Ошибка загрузки контракта:', error)
    } finally {
      setLoadingInfo(false)
    }
  }

  async function releaseFunds() {
    if (!account || !contractData.address) return
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(
        contractData.address,
        contractData.abi,
        signer
      )
      
      console.log('Releasing funds...')
      const tx = await contract.releaseFunds()
      alert('⏳ Транзакция отправлена! Ожидаем подтверждения...')
      
      await tx.wait()
      alert('✅ Средства отправлены разработчику!')
      
      // Обновляем инфо
      await loadContractInfo()
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Ошибка: ' + (error.reason || error.message))
    }
  }

  async function refundFunds() {
    if (!account || !contractData.address) return
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(
        contractData.address,
        contractData.abi,
        signer
      )
      
      console.log('Refunding...')
      const tx = await contract.refund()
      alert('⏳ Транзакция отправлена! Ожидаем подтверждения...')
      
      await tx.wait()
      alert('✅ Средства возвращены!')
      
      await loadContractInfo()
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Ошибка: ' + (error.reason || error.message))
    }
  }

  async function createNewEscrow(e) {
    e.preventDefault()
    
    if (!account) {
      alert('Подключите кошелек!')
      return
    }

    try {
      setLoading(true)
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // Создаем новый контракт
      const SimpleEscrow = new ethers.ContractFactory(
        contractData.abi,
        contractData.bytecode,
        signer
      )
      
      console.log('Создаем новый escrow контракт...')
      const escrow = await SimpleEscrow.deploy(developerAddress, {
        value: ethers.parseEther(projectBudget)
      })
      
      alert('⏳ Транзакция отправлена! Ожидаем подтверждения...')
      
      await escrow.waitForDeployment()
      const address = await escrow.getAddress()
      
      setNewContractAddress(address)
      alert(`✅ Новый Escrow создан!\n\nАдрес: ${address}`)
      
      setDeveloperAddress('')
      setProjectBudget('')
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Ошибка: ' + (error.reason || error.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (account) {
      loadContractInfo()
    }
  }, [account])

  return (
    <div className="App">
      <header>
        <h1>🔒 SecureWork Protocol</h1>
        <p>Decentralized Freelance + Bug Bounty Platform</p>
      </header>

      <div className="card">
        <button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="connect-button"
        >
          {isConnecting ? 'Подключение...' : 
           account ? `✓ ${account.slice(0, 6)}...${account.slice(-4)}` : 
           '🦊 Connect MetaMask'}
        </button>

        {account && (
          <div className="success-message">
            ✅ Кошелек подключен!
          </div>
        )}
      </div>

      {account && contractInfo && (
        <div className="card">
          <h2>📋 Deployed Escrow Contract</h2>
          
          <div style={{textAlign: 'left', marginBottom: '1rem'}}>
            <p><strong>Contract:</strong> <code>{contractInfo.address.slice(0, 10)}...</code></p>
            <p><strong>Client:</strong> <code>{contractInfo.client.slice(0, 10)}...</code></p>
            <p><strong>Developer:</strong> <code>{contractInfo.developer.slice(0, 10)}...</code></p>
            <p><strong>Amount:</strong> {contractInfo.amount} ETH</p>
            <p><strong>Status:</strong> {
              contractInfo.isCompleted ? '✅ Completed' :
              contractInfo.isRefunded ? '↩️ Refunded' :
              '⏳ Active'
            }</p>
          </div>

          {!contractInfo.isCompleted && !contractInfo.isRefunded && (
            <div style={{display: 'flex', gap: '1rem'}}>
              <button 
                onClick={releaseFunds} 
                className="submit-button"
                style={{flex: 1, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'}}
              >
                ✅ Release Funds
              </button>
              <button 
                onClick={refundFunds} 
                className="submit-button"
                style={{flex: 1, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}}
              >
                ↩️ Refund
              </button>
            </div>
          )}

          <a 
            href={`https://sepolia.etherscan.io/address/${contractInfo.address}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{display: 'inline-block', marginTop: '1rem', color: '#667eea'}}
          >
            View on Etherscan →
          </a>
        </div>
      )}

      {account && (
        <div className="card">
          <h2>➕ Create New Escrow Project</h2>
          <form onSubmit={createNewEscrow} className="escrow-form">
            <div className="form-group">
              <label>Developer Address:</label>
              <input
                type="text"
                placeholder="0x..."
                value={developerAddress}
                onChange={(e) => setDeveloperAddress(e.target.value)}
                required
              />
              <small style={{opacity: 0.6}}>Адрес кошелька разработчика</small>
            </div>

            <div className="form-group">
              <label>Project Budget (ETH):</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="0.01"
                value={projectBudget}
                onChange={(e) => setProjectBudget(e.target.value)}
                required
              />
              <small style={{opacity: 0.6}}>Сумма в Sepolia ETH</small>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? '⏳ Creating...' : '🚀 Create New Escrow'}
            </button>
          </form>

          {newContractAddress && (
            <div className="success-message" style={{marginTop: '1rem'}}>
              ✅ New contract at: 
              <a 
                href={`https://sepolia.etherscan.io/address/${newContractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{color: '#667eea', marginLeft: '0.5rem'}}
              >
                {newContractAddress.slice(0, 12)}...
              </a>
            </div>
          )}
        </div>
      )}

      <div className="info">
        <h3>✅ What We Built:</h3>
        <ul>
          <li>✅ Smart Contract Escrow (Solidity)</li>
          <li>✅ Deployed to Sepolia Testnet</li>
          <li>✅ Web3 Frontend Integration</li>
          <li>✅ Release & Refund Functionality</li>
          <li>✅ Create New Escrow Contracts</li>
          <li>⏳ Bug Bounty Integration (next)</li>
          <li>⏳ Reputation System (next)</li>
        </ul>
      </div>
    </div>
  )
}

export default App