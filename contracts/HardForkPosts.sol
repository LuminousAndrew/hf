// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract HardForkPosts {
    address public treasury;

    struct Comment {
        address commenter;
        string text;
        uint256 timestamp;
    }

    struct Investment {
        address investor;
        uint256 amount;
    }

    struct Post {
        uint256 id;
        address author;
        string content;
        string mediaHash;
        uint256 totalInvested;
        uint256 timestamp;
        Comment[] comments;     // New: List of comments
        Investment[] donors;    // New: List of who gave what
    }

    mapping(uint256 => Post) public posts;
    uint256 public postCount;

    constructor(address _treasury) {
        treasury = _treasury;
    }

    function createPost(string memory _content, string memory _mediaHash) public {
        postCount++;
        Post storage newPost = posts[postCount];
        newPost.id = postCount;
        newPost.author = msg.sender;
        newPost.content = _content;
        newPost.mediaHash = _mediaHash;
        newPost.timestamp = block.timestamp;
    }

    function addComment(uint256 _postId, string memory _text) public {
        require(_postId > 0 && _postId <= postCount, "Post doesn't exist");
        posts[_postId].comments.push(Comment(msg.sender, _text, block.timestamp));
    }

    function invest(uint256 _postId) public payable {
        require(msg.value > 0, "Must invest more than 0");
        Post storage post = posts[_postId];
        
        uint256 amountToCreator = (msg.value * 95) / 100;
        uint256 amountToTreasury = msg.value - amountToCreator;

        // Using .call for better compatibility with XDC network & wallets
        (bool s1, ) = payable(post.author).call{value: amountToCreator}("");
        require(s1, "Creator pay failed");
        
        (bool s2, ) = payable(treasury).call{value: amountToTreasury}("");
        require(s2, "Treasury pay failed");

        post.totalInvested += msg.value;
        
        // Track the donor and amount
        post.donors.push(Investment(msg.sender, msg.value));
    }

    // Updated helper to return the data including donors and comments
    function getPost(uint256 _postId) public view returns (Post memory) {
        return posts[_postId];
    }

    function getAllPosts() public view returns (Post[] memory) {
        Post[] memory allPosts = new Post[](postCount);
        for (uint256 i = 1; i <= postCount; i++) {
            allPosts[i - 1] = posts[i];
        }
        return allPosts;
    }
}