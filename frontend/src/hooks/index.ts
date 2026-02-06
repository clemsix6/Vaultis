export {
  useWatchTotalSupply,
  useWatchOwner,
  useWatchTokenURI,
  useWatchBalance,
  useTokenOfOwnerByIndex,
  useAllWatches,
  useWatchNFTOwner,
  useKYCRegistryAddress,
} from "./useWatchNFT";

export {
  useIsAuthorized,
  useIsWhitelisted,
  useIsBlacklisted,
  useKYCOwner,
} from "./useKYCRegistry";

export {
  useMintWatch,
  useTransferWatch,
  useWhitelistAddress,
  useRemoveFromWhitelist,
  useBlacklistAddress,
  useRemoveFromBlacklist,
  useBatchWhitelist,
  useBatchBlacklist,
  useSetKYCRegistry,
} from "./useContractWrite";
