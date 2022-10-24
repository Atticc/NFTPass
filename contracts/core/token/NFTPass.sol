//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "erc721a/contracts/IERC721A.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error NotWhiteListed();
error InvalidPrice();
error InvalidQuantity();
error InvalidPassType();
error FreeMintUsed();
error WithdrawFailed();
error MintingNotStarted();
error MintingFinished();
error OnlyOneFreeMintAllowed();

contract NFTPass is ERC721A, Ownable {

    uint256 public constant MINT_START = 1666530000;
    event NFTWhiteListed(address indexed nft);
    event NFTPassPurchased(address indexed buyer, uint256 indexed quantity, uint256 price);
    event OwnerWithdrawn(uint256 amount);
    event OwnerMinting(uint256 quantity);

    enum NFTPassType { ERC721, ERC1155, ERC721A }
    // baseURI for the token metadata
    string private metadataURI;
    // whitelist for early adopter passes
    mapping(address => bool) public eapWhitelist ;
    uint256 public price = 0 ether;

    // for any whitelist wallet address, max number of passes they can mint is 1
    mapping(address => bool) public whitelistMinted;

    constructor(string memory name_, string memory symbol_, string memory baseUrl_) ERC721A(name_, symbol_) {
        metadataURI = baseUrl_;
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, it can be overridden in child contracts.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return metadataURI;
    }

    function checkNFTWhitelist(address nftAddress) public view returns (bool) {
        return eapWhitelist[nftAddress];
    }

    function checkUserMinted(address wallet) public view returns (bool) {
        return whitelistMinted[wallet];
    }

    function _checkHolder721(address nftAddress, address wallet) private view returns (bool)  {
        return IERC721(nftAddress).balanceOf(wallet) > 0;
    }

    function _checkHolder1155(address nftAddress, uint256 tokenId, address wallet) private view returns (bool) { 
        return IERC1155(nftAddress).balanceOf(wallet, tokenId) > 0;
    }

    function _checkHolder721A(address nftAddress, address wallet) private view returns (bool) { 
        return IERC721A(nftAddress).balanceOf(wallet) > 0;
    }

    function _mintingStarted() private view returns (bool) {
        return block.timestamp >= MINT_START;
    }

    function checkWhitelist(address nftPass, uint256 tokenId, NFTPassType passType) public view returns (bool) {
        if (!checkNFTWhitelist(nftPass)) {
            return false;
        }
        if (passType == NFTPassType.ERC721) {
            return _checkHolder721(nftPass, msg.sender);
        } else if (passType == NFTPassType.ERC1155) {
            return _checkHolder1155(nftPass, tokenId, msg.sender);
        } else if (passType == NFTPassType.ERC721A) {
            return _checkHolder721A(nftPass, msg.sender);
        } 
        revert InvalidPassType();
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be greater than 0");
        price = newPrice;
    }

    function inviteCommunity(address communityAddr) external onlyOwner {
       eapWhitelist[communityAddr] = true;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert WithdrawFailed();
        emit OwnerWithdrawn(balance);
    }

    /**
     * @dev Mints NFTPasses for the given wallet address and transfer to the sender
     *
     * Requirements:
     *
     * - `quantity is required if it mints multiple tokens`.
     *
     * Emits a {Transfer} event.
     */
    function mint(address nftPass, uint256 tokenId, NFTPassType passType, uint256 quantity) external payable {
        if (totalSupply() + quantity > 5555) {
            revert MintingFinished();
        }
        // `_mint`'s second argument now takes in a `quantity`, not a `tokenId`.
        // if (!_mintingStarted()) revert MintingNotStarted();
        bool isWhitelisted;
        if (msg.sender == owner()) {
            emit OwnerMinting(quantity);
        } else if ( price > 0 ether && msg.value >= price * quantity) {
            // this is a purchase of a pass
            emit NFTPassPurchased(msg.sender, quantity, msg.value);
        } else {
            // // every whitelisted user can only do one free mint
            if (quantity > 1) {
                revert InvalidQuantity();
            }
            // check if the user has already minted a pass for free
            if (checkUserMinted(msg.sender)) {
                revert OnlyOneFreeMintAllowed();
            }
            // check the nft that user holds is whitelisted
            if (!checkWhitelist(nftPass, tokenId, passType)) {
                revert NotWhiteListed();
            }
            isWhitelisted = true;
        }
        _mint(msg.sender, quantity);
        if (isWhitelisted) {
            whitelistMinted[msg.sender] = true;
        }
    }
}