// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PongScores is Ownable {
    int public highScore;
    string public uuid;
    string public nickName;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setHighScore(int _score, string calldata _uuid, string calldata _nickName) public onlyOwner {
        highScore = _score;
        uuid = _uuid;
        nickName = _nickName;
    }

    function getHighScore() external view returns (int, string calldata, string calldata) {
        return (highScore, uuid, nickName);
    }
}