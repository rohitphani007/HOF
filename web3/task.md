### **🔗 PERSON 1: BLOCKCHAIN LEAD**

**Responsibilities**: All smart contract development, testing, deployment

#### **Hours 0-2: Setup**
* [ ] Install Node.js, VS Code, Hardhat
* [ ] Create `blockchain` folder
* [ ] Initialize Hardhat project
* [ ] Install OpenZeppelin contracts
* [ ] Test basic setup with sample contract

**Deliverable**: Working Hardhat environment with test passing

---

#### **Hours 2-5: Write Smart Contracts**
* [ ] Create `PropertyToken.sol` (ERC20 token for property shares)
  - Constructor with property details
  - Rent deposit function
  - Rent distribution function
  - Get rent share calculation
* [ ] Create `PropertyFactory.sol` (Creates new properties)
  - Create property function
  - Track all properties
  - Event emissions

**Deliverable**: Two .sol files with complete contracts

---

#### **Hours 5-7: Testing**
* [ ] Write tests for PropertyToken
  - Test token creation
  - Test rent deposit
  - Test rent share calculation
  - Test token transfers
* [ ] Write tests for PropertyFactory
  - Test property creation
  - Test property listing
* [ ] Run `npx hardhat test` - all tests should pass ✓

**Deliverable**: Test suite with 100% passing tests

---

#### **Hours 7-9: Deployment**
* [ ] Write deployment script (`scripts/deploy.js`)
* [ ] Deploy to local Hardhat network
* [ ] Deploy 2-3 sample properties with different values
* [ ] Note down all deployed contract addresses
* [ ] Create a `DEPLOYED_ADDRESSES.txt` file with all addresses

**Deliverable**: Running local blockchain with deployed contracts + addresses file

---

#### **Hours 9-10: Documentation & Handoff**
* [ ] Export contract ABIs to `contracts/` folder
* [ ] Create `BLOCKCHAIN_README.md`:
  - How to run local node
  - How to deploy contracts
  - Contract addresses
  - How to interact with contracts
* [ ] Share with Person 4 (Integration Lead)

**Critical Handoff**: Give Person 4 the contract ABIs and addresses