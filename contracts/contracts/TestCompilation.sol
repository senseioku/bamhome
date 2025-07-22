// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Simple test contract to verify compilation
contract TestCompilation {
    uint256 public testValue = 123;
    
    function setTestValue(uint256 _value) public {
        testValue = _value;
    }
}