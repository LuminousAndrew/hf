// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract HardForkRegistry {
    struct UserProfile {
        string username;
        string metadataCID;
    }

    mapping(address => UserProfile) public profiles;
    mapping(string => address) public usernameToAddress;

    // Change function name and args to match your frontend call
    function registerProfile(string memory _username, string memory _metadataCID) public {
        require(bytes(_username).length > 0, "Username empty");
        require(usernameToAddress[_username] == address(0), "Handle taken");

        profiles[msg.sender] = UserProfile(_username, _metadataCID);
        usernameToAddress[_username] = msg.sender;
    }

    function getProfile(address _user) public view returns (string memory username, string memory metadataCID) {
        return (profiles[_user].username, profiles[_user].metadataCID);
    }
}