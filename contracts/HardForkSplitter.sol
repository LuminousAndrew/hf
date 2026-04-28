// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Interface to talk to your Posts contract
interface IHardForkPosts {
    function updatePostInvestment(uint256 _postId, uint256 _amount) external;
}

contract HardForkSplitter {
    address public treasury;
    address public postsContract; // Address of your Posts deployment
    uint256 public platformFee = 5;

    event TipSent(address indexed from, address indexed to, uint256 postId, uint256 amount);

    constructor(address _treasury, address _postsContract) {
        treasury = _treasury;
        postsContract = _postsContract;
    }

    // Added _postId so the UI can link the payment to the card
    function supportCreator(address payable _creator, uint256 _postId) public payable {
        require(msg.value > 100 gwei, "Tip too small");

        uint256 fee = (msg.value * platformFee) / 100;
        uint256 creatorShare = msg.value - fee;

        // 1. Pay Creator
        (bool s1, ) = _creator.call{value: creatorShare}("");
        require(s1, "Creator payment failed");

        // 2. Pay Treasury
        (bool s2, ) = payable(treasury).call{value: fee}("");
        require(s2, "Treasury fee failed");

        // 3. Update the Post's total in the other contract
        IHardForkPosts(postsContract).updatePostInvestment(_postId, msg.value);

        emit TipSent(msg.sender, _creator, _postId, creatorShare);
    }
}