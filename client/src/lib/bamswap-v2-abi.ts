// Complete BAMSwapV2 Contract ABI - Deployed at 0xaE97797f29a0f3d5602325E2668e5920C2820455
// Generated from attached_assets/BAMSwapV2_ABI_1753191263952.txt
export const BAMSWAP_V2_ABI = [
        {
                "inputs": [],
                "name": "buyBAMWithBNB",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
        },
        {
                "inputs": [
                        {
                                "internalType": "uint256",
                                "name": "usdtAmount",
                                "type": "uint256"
                        }
                ],
                "name": "buyBAMWithUSDT",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
        },
        {
                "inputs": [],
                "name": "bamPriceInUSD",
                "outputs": [
                        {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                        }
                ],
                "stateMutability": "view",
                "type": "function"
        },
        {
                "inputs": [],
                "name": "minPurchaseLimit",
                "outputs": [
                        {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                        }
                ],
                "stateMutability": "view",
                "type": "function"
        },
        {
                "inputs": [],
                "name": "maxPurchaseLimit",
                "outputs": [
                        {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                        }
                ],
                "stateMutability": "view",
                "type": "function"
        },
        {
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "",
                                "type": "address"
                        }
                ],
                "name": "walletPurchases",
                "outputs": [
                        {
                                "internalType": "uint256",
                                "name": "",
                                "type": "uint256"
                        }
                ],
                "stateMutability": "view",
                "type": "function"
        },
        {
                "inputs": [],
                "name": "getPurchaseInfo",
                "outputs": [
                        {
                                "internalType": "uint256",
                                "name": "minPurchase",
                                "type": "uint256"
                        },
                        {
                                "internalType": "uint256",
                                "name": "maxPurchase",
                                "type": "uint256"
                        },
                        {
                                "internalType": "uint256",
                                "name": "maxPerWallet",
                                "type": "uint256"
                        },
                        {
                                "internalType": "uint256",
                                "name": "currentBAMPrice",
                                "type": "uint256"
                        },
                        {
                                "internalType": "uint256",
                                "name": "bamPerUSDT",
                                "type": "uint256"
                        }
                ],
                "stateMutability": "view",
                "type": "function"
        },
        {
                "inputs": [],
                "name": "owner",
                "outputs": [
                        {
                                "internalType": "address",
                                "name": "",
                                "type": "address"
                        }
                ],
                "stateMutability": "view",
                "type": "function"
        },
        {
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "token",
                                "type": "address"
                        },
                        {
                                "internalType": "uint256",
                                "name": "amount",
                                "type": "uint256"
                        }
                ],
                "name": "emergencyWithdraw",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
        },
        {
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "_usdt",
                                "type": "address"
                        },
                        {
                                "internalType": "address",
                                "name": "_usdb",
                                "type": "address"
                        },
                        {
                                "internalType": "address",
                                "name": "_bam",
                                "type": "address"
                        },
                        {
                                "internalType": "address",
                                "name": "_feeRecipient",
                                "type": "address"
                        },
                        {
                                "internalType": "address",
                                "name": "_paymentRecipient",
                                "type": "address"
                        }
                ],
                "stateMutability": "nonpayable",
                "type": "constructor"
        },
        {
                "inputs": [],
                "name": "EnforcedPause",
                "type": "error"
        },
        {
                "inputs": [],
                "name": "ExpectedPause",
                "type": "error"
        },
        {
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "owner",
                                "type": "address"
                        }
                ],
                "name": "OwnableInvalidOwner",
                "type": "error"
        },
        {
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "account",
                                "type": "address"
                        }
                ],
                "name": "OwnableUnauthorizedAccount",
                "type": "error"
        },
        {
                "inputs": [],
                "name": "ReentrancyGuardReentrantCall",
                "type": "error"
        },
        {
                "inputs": [
                        {
                                "internalType": "address",
                                "name": "token",
                                "type": "address"
                        }
                ],
                "name": "SafeERC20FailedOperation",
                "type": "error"
        },
        {
                "anonymous": false,
                "inputs": [
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "oldPrice",
                                "type": "uint256"
                        },
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "newPrice",
                                "type": "uint256"
                        }
                ],
                "name": "BAMPriceUpdated",
                "type": "event"
        },
        {
                "anonymous": false,
                "inputs": [
                        {
                                "indexed": true,
                                "internalType": "address",
                                "name": "user",
                                "type": "address"
                        },
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "bnbAmount",
                                "type": "uint256"
                        },
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "bamAmount",
                                "type": "uint256"
                        },
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "bnbPrice",
                                "type": "uint256"
                        },
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "paymentToRecipient",
                                "type": "uint256"
                        },
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "remainingInContract",
                                "type": "uint256"
                        }
                ],
                "name": "BuyBAMWithBNB",
                "type": "event"
        },
        {
                "anonymous": false,
                "inputs": [
                        {
                                "indexed": true,
                                "internalType": "address",
                                "name": "user",
                                "type": "address"
                        },
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "usdtAmount",
                                "type": "uint256"
                        },
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "bamAmount",
                                "type": "uint256"
                        },
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "paymentToRecipient",
                                "type": "uint256"
                        },
                        {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "remainingInContract",
                                "type": "uint256"
                        }
                ],
                "name": "BuyBAMWithUSDT",
                "type": "event"
        }
] as const;

export const BAMSWAP_V2_ADDRESS = "0xaE97797f29a0f3d5602325E2668e5920C2820455";