// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PongScores is Ownable {

    struct ScoreData {
    uint128 highScore;
    uint128 uuid;
    bytes32 nickName;
    }

    ScoreData public scoreData;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setHighScore(uint128 _score, uint128 _uuid, bytes32 _nickName) public onlyOwner {
        scoreData.highScore = _score;
        scoreData.uuid = _uuid;
        scoreData.nickName = _nickName;
    }

    function getHighScore() external view returns (uint128, uint128, bytes32) {
        return (highScore, uuid, nickName);
    }
}