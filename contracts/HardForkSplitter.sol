// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IHardForkPosts {
    function updatePostInvestment(uint256 _postId, address _donor, uint256 _amount) external;
}

contract HardForkSplitter {
    // The specific Treasury Address you requested
address payable public constant TREASURY = payable(0x215C2fF021637eBeb98eF836f097a0Aef44216c9);
    address public postsContract; 

    event TipSent(address indexed from, address indexed to, uint256 postId, uint256 amount);

    constructor(address _postsContract) {
        postsContract = _postsContract;
    }

    function supportCreator(address payable _creator, uint256 _postId) public payable {
        require(msg.value > 0, "Must send XDC");

        uint256 fee = (msg.value * 5) / 100; // 5%
        uint256 creatorShare = msg.value - fee; // 95%

        // 1. Pay Creator (95%)
        (bool s1, ) = _creator.call{value: creatorShare}("");
        require(s1, "Creator payment failed");

        // 2. Pay Treasury (5%)
        (bool s2, ) = TREASURY.call{value: fee}("");
        require(s2, "Treasury fee failed");

        // 3. Update the Posts contract records
        IHardForkPosts(postsContract).updatePostInvestment(_postId, msg.sender, msg.value);

        emit TipSent(msg.sender, _creator, _postId, msg.value);
    }
}