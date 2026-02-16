// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleEscrow {
    address public client;
    address public developer;
    uint256 public amount;
    bool public isCompleted;
    bool public isRefunded;
    
    event EscrowCreated(address indexed client, address indexed developer, uint256 amount);
    event FundsReleased(address indexed developer, uint256 amount);
    event FundsRefunded(address indexed client, uint256 amount);
    
    constructor(address _developer) payable {
        require(_developer != address(0), "Invalid developer address");
        require(msg.value > 0, "Must send ETH");
        
        client = msg.sender;
        developer = _developer;
        amount = msg.value;
        isCompleted = false;
        isRefunded = false;
        
        emit EscrowCreated(client, developer, amount);
    }
    
    function releaseFunds() external {
        require(msg.sender == client, "Only client can release funds");
        require(!isCompleted, "Already completed");
        require(!isRefunded, "Already refunded");
        
        isCompleted = true;
        
        (bool success, ) = payable(developer).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsReleased(developer, amount);
    }
    
    function refund() external {
        require(msg.sender == client, "Only client can refund");
        require(!isCompleted, "Already completed");
        require(!isRefunded, "Already refunded");
        
        isRefunded = true;
        
        (bool success, ) = payable(client).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsRefunded(client, amount);
    }
    
    function getStatus() external view returns (
        address _client,
        address _developer,
        uint256 _amount,
        bool _isCompleted,
        bool _isRefunded
    ) {
        return (client, developer, amount, isCompleted, isRefunded);
    }
}