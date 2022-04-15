import {EPlatform} from '@src/app/services/sources/investment.source.types';

export interface AssetPriceChainItem {
  name: string; // Asset name (eg: USDT)
  price: string; // price of asset
  factor?: string; // factor by which to multiply underlying asset to get price
}

export interface AssetPrice {
  price: string;
  chain: AssetPriceChainItem[];
}

export interface Transaction {
  blockNumber: string;
  timestamp: string; // unix timestamp (seconds)
  hash: string;
}

export interface AssetPosition {
  id: string;
  platform: EPlatform;
  baseId: string;
  shares: string;
  shareToken: string; // token name
  transaction: Transaction;
  transactionEntry?: Transaction; // only for completed transaction
  logo?: string;
}

export interface AdapterHistory {
  name: string;
  ongoing: AssetPosition[];
  completed: any[];
}

export interface AssetPositionExtended extends AssetPosition {
  value: {
    initial: AssetPrice;
    current: AssetPrice;
  };
  apy: {
    position: string;
    30: string;
    7: string;
    1: string;
  };
}

export interface AssetPositionCompleted extends AssetPosition {
  transactionEntry: Transaction;
}

export interface AssetPositionCompletedExtended extends AssetPositionCompleted {
  value: {
    initial: AssetPrice;
    current: AssetPrice;
  };
}

export interface AdapterHistoryExtended extends AdapterHistory {
  ongoing: AssetPositionExtended[];
  completed: AssetPositionCompletedExtended[];
}

export interface DailyPriceResponse {
  id: string;
  name: string;
  daily: {
    timestamp: string;
    price: AssetPrice;
  }[];
}
