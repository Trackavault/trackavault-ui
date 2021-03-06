import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {environment} from '@src/environments/environment';
import {catchError, map} from 'rxjs/operators';
import {AdapterHistoryExtended, DailyPriceResponse} from '@src/app/services/api/api.service.types';

export interface AssetPriceChainItem {
  name: string; // Asset name (eg: USDT)
  price: string; // price of asset
  factor?: string; // factor by which to multiply underlying asset to get price
}

export interface AssetPrice {
  price: string;
  chain: AssetPriceChainItem[];
}

export interface AssetPrices {
  [blockNumber: string]: AssetPrice;
}

interface PriceDailyArg {
  id: string;
  platform: string;
  blockNumber: string;
}

interface IMigrationVault {
  symbol: string;
  token: string;
  vaultFrom: string;
  vaultTo: string;
  apyTooltip: string;
  migrationMessage: string;
}

interface IMigrationResult {
  [key: string]: IMigrationVault;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  GetAssetPrice(address: string, blockNumber?: string): Observable<AssetPrice> {
    const url = `${environment.apiUrl}/price?address=${address}${(blockNumber ? `&blockNumber=${blockNumber}` : '')}`;
    return this.http.get<AssetPrice>(url);
  }

  GetAssetPrices(address: string, blockNumbers: string[]): Observable<AssetPrices> {
    const url = `${environment.apiUrl}/price`;
    const body = {address, blockNumbers};
    return this.http.post<AssetPrices>(url, body);
  }

  GetAssetPricesOrdered(address: string, blockNumbers: string[]): Observable<(AssetPrice | null)[]> {
    const url = `${environment.apiUrl}/price`;
    const body = {address, blockNumbers};
    return this.http.post<AssetPrices>(url, body).pipe(
      map(assetPrices => {
        return blockNumbers.map(blockNumber => assetPrices[blockNumber || null]);
      })
    );
  }

  GetDefi(addresses: string[], enableExperimental: boolean): Observable<(AdapterHistoryExtended[])> {
    return this.http.post<AdapterHistoryExtended[]>(`${environment.apiUrl}/defi`, {addresses, experimental: enableExperimental});
  }

  GetDailyPrices(assets: PriceDailyArg[]): Observable<(DailyPriceResponse[])> {
    return this.http.post<DailyPriceResponse[]>(`${environment.apiUrl}/price/daily`, {assets});
  }

  GetStats(): Observable<(DailyPriceResponse[][])> {
    return this.http.get<DailyPriceResponse[][]>(`${environment.apiUrl}/defi/stats`);
  }

  GetMigrations(): Observable<IMigrationResult> {
    return this.http.get<any>('https://raw.githubusercontent.com/yearn/yearn-finance/master/app/containers/Vaults/migrationWhitelist.json')
      .pipe(
        catchError(() => of([])),
        map( (values: any[]) => {
          return values.reduce((acc, elem) => {
            acc[elem.vaultFrom.toLowerCase()] = elem;
            return acc;
          }, {});
        })
      );
  }
}
