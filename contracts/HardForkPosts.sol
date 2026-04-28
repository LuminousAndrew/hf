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
        Comment[] comments;
        Investment[] donors;
    }

    mapping(uint256 => Post) public posts;
    uint256 public postCount;

    // Restrict sensitive functions to the Splitter contract
    address public splitter;

    constructor(address _treasury) {
        treasury = _treasury;
    }

    function setSplitter(address _splitter) public {
        require(splitter == address(0), "Splitter already set");
        splitter = _splitter;
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

    // This is called by the Splitter to record the donation
    function updatePostInvestment(uint256 _postId, address _donor, uint256 _amount) external {
        require(msg.sender == splitter, "Only splitter can update");
        require(_postId > 0 && _postId <= postCount, "Post doesn't exist");
        
        posts[_postId].totalInvested += _amount;
        posts[_postId].donors.push(Investment(_donor, _amount));
    }

    function getAllPosts() public view returns (Post[] memory) {
        Post[] memory allPosts = new Post[](postCount);
        for (uint256 i = 1; i <= postCount; i++) {
            allPosts[i - 1] = posts[i];
        }
        return allPosts;
    }
}