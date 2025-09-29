// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PongScores {

    struct ScoreData { // occupies 2x256bit slot
    uint128 highScore;
    uint128 uuid;
    bytes32 nickName;  // usernames limited to 32 chars
    }

    address public immutable owner;

    ScoreData public scoreData;

    event HighScoreUpdate(
        uint128 indexed score,
        uint128 indexed uuid,
        bytes32 nickName
    );

    error NotOwner();

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    function setHighScore(uint128 _score, uint128 _uuid, bytes32 _nickName) external onlyOwner {
        scoreData.highScore = _score;
        scoreData.uuid = _uuid;
        scoreData.nickName = _nickName;

        emit HighScoreUpdate(_score, _uuid, _nickName);
    }

    function getHighScore() external view returns (uint128 score, uint128 uuid, bytes32 nickName) {
        return (scoreData.highScore, scoreData.uuid, scoreData.nickName);
    }
}