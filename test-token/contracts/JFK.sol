// SPDX-License-Identifier: MIT
// 0x09E7AD76c2d84e8274236f36649A6B9D4748CC8D

pragma solidity ^0.8.8;

interface IERC20 {
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256 balance);
    function transfer(address to, uint256 amount) external returns (bool success);
    function approve(address spender, uint256 amount) external returns (bool success);
    function allowance(address _wner, address spender) external view returns (uint256 remaining);
    function transferFrom(address from, address to, uint256 amount) external returns (bool success);
}

abstract contract ERC20 is IERC20{

    string _name;
    string _symbol;
    uint public _totalSupply;

    // address with amount from each wallet
    mapping(address => uint) public _balances; // owner => balance
    mapping(address => mapping(address => uint)) public _allowance; // owner => (spender => amount)

    constructor(string memory name_, string memory symbol_){
        _name = name_;
        _symbol = symbol_;
    }

    // when use function interface that use override
    function name() public override view returns (string memory){
        return _name;
    }

    function symbol() public override view returns (string memory){
        return _symbol;
    }

    function decimals() public override pure returns (uint8){
        return 0;
    }

    function totalSupply() public override view returns (uint256){
        return _totalSupply;
    }

    // show uint balnce from owner
    function balanceOf(address owner) public override view returns (uint256 balance){
        return _balances[owner];
    }

    // transfer from me to other 
    function transfer(address to, uint256 amount) public override returns (bool success){
        _transfer(msg.sender, to, amount);
        return true;
    }

    // give ability to other to send token from me
    function approve(address spender, uint256 amount) public override returns (bool success){
        _approve(msg.sender, spender, amount);
        return true;
    }

    // read only 
    function allowance(address owner, address spender) public override view returns (uint256 remaining){
        return _allowance[owner][spender]; // total token that approve to send 
    } 

    function transferFrom(address from, address to, uint256 amount) public override returns (bool success){
        // if not owner
        if (from != msg.sender){
            uint allowanceAmount = _allowance[from][msg.sender]; // token that allow by me to send
            // when transfer must less than allowance
            require(amount <= allowanceAmount, "Transfer amount exceeds allowance");
            // minus of amount when when them use to send 
            _approve(from, msg.sender, allowanceAmount - amount);
        }

        _transfer(from, to, amount);
        return true;
    }

    // ====== PRIVATE OR INTERNAL FUNCTION ====== //
    // can use only in this function cannot call to other
    // internal to use other contract
    function _transfer(address from, address to, uint amount) public {
        require(from != address(0), "Transfer from zero address");
        require(to !=  address(0), "Transfer to zero address");
        require(amount <= _balances[from], "Transfer amount exceeds balance");

        _balances[from] -= amount;
        _balances[to] += amount;

        emit Transfer(from, to, amount);
    }

    // owner => spender => amount
    function _approve(address owner, address spender, uint amount) public{
        require(owner != address(0), "Approve from zero address");
        require(spender != address(0), "Approve spender zero address");
        _allowance[owner][spender] = amount;

        emit Approval(owner, spender, amount);
    }

    // minting token 
    function _mint(address to, uint amount) public{
        require(to != address(0), "Mint to zero address");
        
        // mint token 
        _balances[to] += amount;
        // limit total supply
        _totalSupply += amount;

        emit Transfer(address(0), to, amount);
    }

    // burn token if more than 
    function _burn(address from, uint amount) public{
        require(from != address(0), "Burn to zero address");
        require(amount <= _balances[from], "Burn amount exceeds belance");

        // burn token
        _balances[from] -= amount;
        // decrease total supply
        _totalSupply -= amount;

        emit Transfer(from, address(0), amount);
    }
}

// extend contract
contract JFK is ERC20{
    
    // super constructor
    // fixed name 
    constructor() ERC20("JFK Coin", "JFK"){

    }

    // when deposit is give to JFK, if want to ETH back must transfer back by JFK with ETH
    // deposit to stake 
    function deposit() public payable{
        require(msg.value > 0, "Amount is zero");

        // mint token
        _mint(msg.sender, msg.value);
    }

    // transfer back to user
    function withdraw(uint amount) public{
        require(amount > 0 && amount <= _balances[msg.sender], "Withdraw amount exceeds balance");

        payable(msg.sender).transfer(amount);
        _burn(msg.sender, amount);
    }
}