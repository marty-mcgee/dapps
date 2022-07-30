var Web3 = require("web3");
var EthereumENS = require("ethereum-ens");

const defaultProvider = "https://mainnet.infura.io/v3/432d743bb1d944268c6e3725f243a7e0";

function ENS() {
  this.addInput("name", "string");
  this.addInput("address", "string");
  this.addOutput("address", "string");
  this.addOutput("name", "string");
  this.properties = { provider: defaultProvider };
  this.cached = false;
  this.cachedAddress = false;
  this.size[0] = 210;
}

ENS.title = "ENS";

ENS.prototype.onAdded = function() {
  this.connectWeb3();
};

ENS.prototype.connectWeb3 = function() {
  if (this.properties.provider) {
    try {
      this.web3 = new Web3(this.properties.provider);
      this.ens = new EthereumENS(this.web3);
      this.cached = false;
      this.cachedAddress = false;
    } catch (e) {
      console.log(e);
    }
  }
};

ENS.prototype.onExecute = async function() {
  let input = this.getInputData(0);

  if (input && typeof input.indexOf == "function" && input.indexOf(".eth") >= 0) {

    //FORCE THEM TO TYPE THE .ETH AT THE END FOR NOW ... IT WAS FAILING AND COULDN'T BE CAUGHT IF NOT

    if (input && (!this.cached || this.cached != input)) {
      this.cached = input;

      try {
        let res = await this.ens.resolver(this.cached);
        this.value = await this.ens.resolver(this.cached).addr();
      } catch (e) {
        console.log(e);
        this.value = null;
      }
      if (this.value) this.value = this.value.toLowerCase();
    }
  }


  this.setOutputData(0, this.value);

  // resolve address
  let inputAddress = this.getInputData(1);

  if (inputAddress && inputAddress.indexOf("0x") < 0) {
    inputAddress = "0x" + inputAddress;
  }

  if (inputAddress && (!this.cachedAddress || this.cachedAddress != inputAddress)) {
    this.cachedAddress = inputAddress;

    if (inputAddress) {
      try {
        var name = await this.ens.reverse(inputAddress).name();

        // Check to be sure the reverse record is correct.
        if (inputAddress.toLowerCase() != (await this.ens.resolver(name).addr()).toLowerCase()) {
          name = "";
        }
        this.setOutputData(1, name);
      } catch (error) {
        console.log(error);
        this.setOutputData(1, "");
      }
    }
  }
};

ENS.prototype.onPropertyChanged = async function(name, value) {
  this.properties[name] = value;
  if (name == "provider") {
    this.connectWeb3();
  }
  return true;
};

export default ENS;
