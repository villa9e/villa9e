// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * $VLG — Village Token
 * ERC-20 token for villa9e platform rewards.
 *
 * Tokenomics:
 *   Total Supply:    100,000,000 VLG (100 million)
 *   Community Pool: 60% (60M) — earned via goals, OoWops, check-ins
 *   Ecosystem:      20% (20M) — partnerships, providers, integrations
 *   Team/Reserves:  12% (12M) — locked 2 years, vesting 3 years
 *   Foundation:      8% (8M)  — village infrastructure, grants
 *
 * On-chain ledger records:
 *   - VLG transfers between villagers
 *   - OoWop validations (with giver/receiver addresses)
 *   - Goal completions (proof of work)
 *   - Data usage consents and earnings
 *   - Deals and service payments
 *
 * Deployed on Polygon (MATIC) for low gas fees.
 * Bridge to Ethereum available at Phase 3.
 *
 * To deploy:
 *   1. Install Foundry: curl -L https://foundry.paradigm.xyz | bash
 *   2. forge create --rpc-url $POLYGON_RPC_URL --private-key $DEPLOYER_KEY contracts/VLGToken.sol:VLGToken
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract VLGToken is ERC20, ERC20Burnable, Ownable, Pausable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100M VLG

    // Village event types logged on-chain
    event OoWopRecorded(address indexed giver, address indexed receiver, bytes32 goalId, uint256 timestamp);
    event GoalCompleted(address indexed villager, bytes32 goalId, string medal, uint256 timestamp);
    event DataConsentLogged(address indexed villager, string dataType, bool consented, uint256 timestamp);
    event DealRecorded(address indexed buyer, address indexed seller, uint256 amount, bytes32 dealId, uint256 timestamp);
    event CheckInRecorded(address indexed villager, uint256 streak, uint256 timestamp);
    event VLGEarned(address indexed villager, uint256 amount, string reason, uint256 timestamp);

    // Authorized minters (backend bridge wallet)
    mapping(address => bool) public isMinter;

    // Village ledger — all on-chain events
    struct LedgerEntry {
        uint256 timestamp;
        string  eventType;  // OOWOP | GOAL_COMPLETE | DATA_CONSENT | DEAL | CHECKIN | EARN
        address actor;
        address counterparty;
        uint256 amount;
        bytes32 referenceId;
        string  metadata;
    }

    LedgerEntry[] public ledger;
    uint256 public totalLedgerEntries;

    constructor(address communityPool, address ecosystem, address team, address foundation)
        ERC20("Village Token", "VLG")
        Ownable(msg.sender)
    {
        // Mint and distribute initial supply
        _mint(communityPool, MAX_SUPPLY * 60 / 100); // 60M community
        _mint(ecosystem,     MAX_SUPPLY * 20 / 100); // 20M ecosystem
        _mint(team,          MAX_SUPPLY * 12 / 100); // 12M team (vesting handled separately)
        _mint(foundation,    MAX_SUPPLY *  8 / 100); // 8M foundation
    }

    modifier onlyMinter() {
        require(isMinter[msg.sender] || msg.sender == owner(), "Not authorized minter");
        _;
    }

    function addMinter(address minter) external onlyOwner { isMinter[minter] = true; }
    function removeMinter(address minter) external onlyOwner { isMinter[minter] = false; }

    // ── Minting (bridge from Supabase points) ────────────────────────────────
    function mintToVillager(address villager, uint256 amount, string calldata reason) external onlyMinter {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(villager, amount);
        _logEntry("EARN", villager, address(0), amount, bytes32(0), reason);
        emit VLGEarned(villager, amount, reason, block.timestamp);
    }

    // ── On-chain village ledger ───────────────────────────────────────────────
    function recordOoWop(address giver, address receiver, bytes32 goalId) external onlyMinter {
        _logEntry("OOWOP", giver, receiver, 0, goalId, "OoWop validation");
        emit OoWopRecorded(giver, receiver, goalId, block.timestamp);
    }

    function recordGoalComplete(address villager, bytes32 goalId, string calldata medal) external onlyMinter {
        _logEntry("GOAL_COMPLETE", villager, address(0), 0, goalId, medal);
        emit GoalCompleted(villager, goalId, medal, block.timestamp);
    }

    function recordDataConsent(address villager, string calldata dataType, bool consented) external onlyMinter {
        _logEntry("DATA_CONSENT", villager, address(0), consented ? 1 : 0, bytes32(0), dataType);
        emit DataConsentLogged(villager, dataType, consented, block.timestamp);
    }

    function recordDeal(address buyer, address seller, uint256 amount, bytes32 dealId) external onlyMinter {
        _logEntry("DEAL", buyer, seller, amount, dealId, "Trading Post deal");
        emit DealRecorded(buyer, seller, amount, dealId, block.timestamp);
    }

    function recordCheckIn(address villager, uint256 streak) external onlyMinter {
        _logEntry("CHECKIN", villager, address(0), streak, bytes32(0), "Spirit check-in");
        emit CheckInRecorded(villager, streak, block.timestamp);
    }

    function _logEntry(
        string memory eventType, address actor, address counterparty,
        uint256 amount, bytes32 referenceId, string memory metadata
    ) internal {
        ledger.push(LedgerEntry({
            timestamp:    block.timestamp,
            eventType:    eventType,
            actor:        actor,
            counterparty: counterparty,
            amount:       amount,
            referenceId:  referenceId,
            metadata:     metadata,
        }));
        totalLedgerEntries++;
    }

    function getLedgerEntry(uint256 index) external view returns (LedgerEntry memory) {
        return ledger[index];
    }

    function getRecentEntries(uint256 count) external view returns (LedgerEntry[] memory) {
        uint256 total = ledger.length;
        uint256 n = count > total ? total : count;
        LedgerEntry[] memory recent = new LedgerEntry[](n);
        for (uint256 i = 0; i < n; i++) {
            recent[i] = ledger[total - n + i];
        }
        return recent;
    }

    // ── ERC-20 overrides ─────────────────────────────────────────────────────
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        bool ok = super.transfer(to, amount);
        if (ok) _logEntry("TRANSFER", msg.sender, to, amount, bytes32(0), "VLG transfer");
        return ok;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
