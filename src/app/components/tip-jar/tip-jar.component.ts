import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-tip-jar',
  templateUrl: './tip-jar.component.html',
  styleUrls: ['./tip-jar.component.css']
})
export class TipJarComponent implements OnInit {
  ethereum: any;
  account: any;

  constructor() { }

  ngOnInit(): void {
    if (typeof window['ethereum'] !== 'undefined') {
      this.ethereum = window['ethereum'];
    }
  }

  getWindow(): Window {
    return window;
  }


  async getAccount() {
    //accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  }

  async login() {
    try {
      const accounts = await this.ethereum.request({ method: 'eth_requestAccounts' });
      this.account = accounts[0];
      this.sentTx();
    } catch (e) {}
  }

  sentTx() {
    this.ethereum
      .request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: this.account,
            to: '0xDCe3a54515EDA66aF0Bf86f02268bECf10Cd5BBC',
            value: '0x000000000000000000000000000000000000000000000000002386f26fc10000'
          },
        ],
      })
      .then((txHash) => console.log(txHash))
      .catch((error) => console.error);
  }
}
