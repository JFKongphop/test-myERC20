// SPDX-License-Identifier: MIT
// 0x93d3D7F3fD439A4490D41c226cBE99019aA9db9a

pragma solidity ^0.8.8;

interface IERC721{

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);    
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) external;
    function safeTransferFrom(address from, address to, uint256 _tokenId) external;
}


interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface ERC721Metadata{
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}


interface ERC1155Metadata_URI {
    function uri(uint256 tokenId) external view returns (string memory);
}


// show data when query of the index id in contract
// show own token when hold it
interface ERC721Enumerable{
    function totalSupply() external view returns (uint256);
    function tokenByIndex(uint256 index) external view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
}

// check address that is wallet not contract
interface IERC721TokenReceiver {
    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes memory _data) external returns(bytes4);
}


abstract contract ERC721 is IERC165, IERC721, ERC721Metadata, ERC1155Metadata_URI, ERC721Enumerable{

    // counting amount in wallet
    mapping(address => uint) public _balances; // owner => balance
    mapping(uint => address) public _owners; // tokenId = > owner || show the owner of this token id
    mapping(address => mapping(address => bool)) public _operatorAppovals; // owner => operator => allow(true / false)
    mapping(uint => address) public _tokenApprovals; // tokenId => operator || show the token id that can operator by who

    // meta data 
    string public _name;
    string public _symbol;
    mapping(uint => string) public _tokenURLIs; // token => URIs


    constructor(string memory name_, string memory symbol_){
        _name = name_;
        _symbol = symbol_;
    }

    // set name
    function name() public override view returns(string memory){
        return _name;
    }

    // set symbol
    function symbol() public override view returns(string memory){
        return _symbol;
    }

    // set URIa
    function tokenURI(uint tokenId) public override view returns(string memory){
        return _tokenURLIs[tokenId];
    }

    function uri(uint256 tokenId) public override view returns(string memory){
        return tokenURI(tokenId);
    }


    // check IERC165 must set all inteface in this function
    function supportsInterface(bytes4 interfaceId) public override pure returns (bool){
        return interfaceId == type(IERC165).interfaceId 
            || interfaceId == type(IERC721).interfaceId
            || interfaceId == type(ERC721Metadata).interfaceId
            || interfaceId == type(ERC1155Metadata_URI).interfaceId
            || interfaceId == type(ERC721Enumerable).interfaceId;
    }


    // just return owner balance of all token not specific token
    function balanceOf(address owner) public override view returns (uint256){
        require(owner != address(0), "Owner is zero address");

        return _balances[owner];
    }


    // check you are owner of this asset
    function ownerOf(uint256 tokenId) public override view returns (address){
        address owner = _owners[tokenId];
        require(owner != address(0), "Token is not exists");
        return owner;
    }


    // approve to some one to this asset
    // owner => operator => allow(true / false)
    function setApprovalForAll(address operator, bool approved) external {
        // cannot aprove by your self
        require(msg.sender != operator, "Approval status for your");

        _operatorAppovals[msg.sender][operator] = approved;

        emit ApprovalForAll(msg.sender, operator, approved);
    }


    // show status operator from owner
    function isApprovedForAll(address owner, address operator) public override view returns (bool){
        return _operatorAppovals[owner][operator];
    }  


    // approve to use this tokenId
    function approve(address to, uint256 tokenId) public override {
        address owner = ownerOf(tokenId);

        require(to != owner, "Approval status for your");
        // can owner of this token || owner is operator of them
        require(msg.sender == owner || isApprovedForAll(owner, msg.sender), "Caller is not token owner or approval for all");

        _approve(to, tokenId);
    }


    // who can manage of this token
    function getApproved(uint256 tokenId) public override view returns (address){
        require(_owners[tokenId] != address(0), "token is not exist");
        return _tokenApprovals[tokenId];
    }


    // transfer token to other and check all of the requie owner or approval
    function transferFrom(address from, address to, uint256 tokenId) public override{
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");

        // check owner before transfrom
        address owner = ownerOf(tokenId);
        require(owner == from, "Transfer from is not token owner");

        // such owner or getApprove or allApprove""
        require(msg.sender == owner || msg.sender == getApproved(tokenId) || isApprovedForAll(owner, msg.sender), "Caller is not owner or approval");

        _balances[from] -= 1;
        _balances[to] += 1;
        // send to other
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);

        // transfer 
        // delste from last owner
        _removeTokenFromOwnerEnumeration(from, tokenId);    
        // send to new owner
        _addTokenToOwnerEnumeration(to, tokenId);

    }


    // transfer to address and check when it not wallet is reject
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override{
        transferFrom(from, to, tokenId);

        require(_checkOnErc721Received(from, to, tokenId, data), "Transfer to non ERC721Reciever implement");
    }


    // like safeTransferFrom but not use data
    function safeTransferFrom(address from, address to, uint256 tokenId) public override{
        safeTransferFrom(from, to, tokenId, "");
    }

    // show totalSupply
    function totalSupply() public override view returns (uint256){
        return _allTokens.length;
    }

    // show token by index
    function tokenByIndex(uint256 index) external view returns (uint256){
        require(index < _allTokens.length - 1, "Index out of bounds");
        
        return _allTokens[index];
    }

    // show index only my own token
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256){
        // check by own balance
        require(index < _balances[owner], "Index out of bounds");
        return _ownerTokens[owner][index];
    }


    // ====== PRIVATE OR INTERNAL FUNCTION ====== //
    function _approve(address to, uint256 tokenId) public {
        _tokenApprovals[tokenId] = to;
        // ownerOf get tokenId to show owner
        address owner = ownerOf(tokenId); 

        emit Approval(owner , to, tokenId);
    }


    // check address can receive ERC721
    // check address that is wallet or contract
    function _checkOnErc721Received(address from, address to, uint tokenId, bytes memory data) public returns(bool){
        if (to.code.length <= 0) return true;

        // instance contract recieve
        IERC721TokenReceiver receiver = IERC721TokenReceiver(to);
        try receiver.onERC721Received(msg.sender, from, tokenId, data)returns(bytes4 interfaceId){
            return interfaceId == type(IERC721TokenReceiver).interfaceId;
        }
        catch Error(string memory reason){
            revert(reason);
        }
        catch {
            revert("Transfer to non ERC721Reciever implement");
        }
    }

    // mint
    function _mint(address to, uint tokenId, string memory uri_) public{
        require(to != address(0), "Mint to zero address");
        require(_owners[tokenId] == address(0), "Token already minted"); // when to token is 0x0 that is minted

        _balances[to] += 1; // mint +1
        _owners[tokenId] = to; // this token that is owner addres when mint
        _tokenURLIs[tokenId] = uri_; // token id with address

        emit Transfer(address(0), to, tokenId);

        // add id token
        _addTokenToAllEnumeration(tokenId);
        // send to by tokenid
        _addTokenToOwnerEnumeration(to, tokenId);
    } 

    // protect when mint to contract not wallet address
    function _safeMint(address to, uint tokenId, string memory uri_, bytes memory data) public{
        _mint(to, tokenId, uri_);

        // check ERC721 receiver
        require(_checkOnErc721Received(address(0), to, tokenId, data), "Mint to non ERC721Reciever implement");
    }

    function safeMint(address to, uint tokenId, string memory uri_) public{  
        _safeMint(to, tokenId, uri_, "");
    } 

    // burn 
    function _burn(uint tokenId) public{
        // check owner
        address owner = ownerOf(tokenId);
        require(msg.sender == owner || msg.sender == getApproved(tokenId) || isApprovedForAll(owner, msg.sender), "Caller is not owner or approved");
        
        // reset to address 0 when burn
        _approve(address(0), tokenId); 

        // burn in wallet
        _balances[owner] -= 1;

        // delete mapping tokenId and URIs
        delete _owners[tokenId];
        delete _tokenURLIs[tokenId];
        
        emit Transfer(owner, address(0), tokenId);

        // remove tokenId
        _removeTokenFromAllEnumeration(tokenId);
        // remove from owner by tokenId
        _removeTokenFromOwnerEnumeration(owner, tokenId);
    }

    // all Enumeration
    // total supply
    uint[] public _allTokens;
    mapping(uint => uint) public _allTokensIndex; // tokenId => index

    // add token to all token
    function _addTokenToAllEnumeration(uint tokenId) public{
        // push tokenId
        _allTokens.push(tokenId);
        // get index of tokenId
        _allTokensIndex[tokenId] = _allTokens.length - 1;
    }

    // remove token from all token for burn
    // pop token in allTokens
    function _removeTokenFromAllEnumeration(uint tokenId) public{
        // pop can use only last index but the index that want to pop not locate at the last index
        // how to pop | switch of the last and index that want to pop
        uint index = _allTokensIndex[tokenId]; // index tokenId
        uint indexLast = _allTokens.length - 1;

        // if token index not at the last index of array
        if (index < indexLast){
            // find last index
            uint idLast = _allTokensIndex[indexLast];
            // switch tokenId by index
            _allTokens[indexLast] = idLast;
            _allTokensIndex[idLast] = index;
        }

        _allTokens.pop();
        // delete tokenId in mapping
        delete _allTokensIndex[tokenId];
    }


    // owner Enumeration
    // owner index of otkenId
    mapping(address => mapping(uint => uint)) public _ownerTokens; // owner => (index => tokenId)
    // where is tokenId in index of owner
    mapping(uint => uint) public _ownedTokenIndex; // tokenId => index

    // add token to owner token
    function _addTokenToOwnerEnumeration(address owner, uint tokenId) public {
        // index of owner
        uint index = _balances[owner] - 1;
        _ownerTokens[owner][index] = tokenId; // owner => (index => tokenId)
        _ownedTokenIndex[tokenId] = index; // tokenId => index
    }

    // show _ownerTokens of the nested mapping to id token
    function showOwnerTokens(address owner, uint index) public view returns(uint){
        return _ownerTokens[owner][index];
    }

    // remove token from owner token for burn
    // remove from last owner and add to new owner not remove from allToken
    function _removeTokenFromOwnerEnumeration(address owner, uint tokenId) public {
        uint index = _ownedTokenIndex[tokenId]; // index want remove
        uint indexLast = _balances[owner]; // check last index of this token

        // check last index
        if (index < indexLast){
            uint idLast = _ownerTokens[owner][indexLast];

            // switch tokenId by index
            _ownerTokens[owner][index] = idLast;
            _ownedTokenIndex[idLast] = index;
        }

        // delete token last index mapping
        delete _ownerTokens[owner][indexLast];
        delete _ownedTokenIndex[tokenId];
    }
}

// implement contarct to use
contract JFKNFT is ERC721 {
    constructor() ERC721("JFK-NonFunToken", "JFKNFT"){

    }
    // mint token
    function create(uint tokenId, string memory uri) public{
        // who mint is owner token
        _mint(msg.sender, tokenId, uri);
    }

    // burn token
    function burn(uint tokenId) public {
        _burn(tokenId);
    }
}