import Web3 from "web3";
import Mtoken from "../build/contracts/Mtoken.json";
import Mswap from "../build/contracts/Mswap.json";

(() => {
  let web3;
  let mtoken;
  let mswap;

  // Metamask/web3
  const web3Init = () => {
    return new Promise((resolve, reject) => {
      // new meta/eth
      if (typeof window.etherwum !== "undefined") {
        window.ethereum
          .enable()
          .then(() => {
            return resolve(new Web3(window.ethereum));
          })
          .catch((e) => {
            reject(e);
          });
      }
      // old meta/web3
      if (typeof window.web3 !== "undefined") {
        return resolve(new Web3(window.web3.currentProvider));
      }
      // local/ganache
      resolve(new Web3("http://localhost:9545"));
    });
  };

  // contracts
  const mtokenKey = Object.keys(Mtoken.networks)[0];
  const mtokenData = Mtoken.networks[mtokenKey];
  const mtokenInit = () => {
    if (mtokenData) {
      return new web3.eth.Contract(Mtoken.abi, mtokenData.address);
    } else {
      window.alert("Mtoken contracts not deployed to a detected network");
    }
  };
  const mswapKey = Object.keys(Mswap.networks)[0];
  const mswapData = Mswap.networks[mswapKey];
  const mswapInit = () => {
    if (mswapData) {
      return new web3.eth.Contract(Mswap.abi, mswapData.address);
    } else {
      window.alert("Mswap contracts not deployed to a detected network");
    }
  };

  // dom manipulation
  const documentInit = () => {
    let accounts = [];
    // to initialize account and get both input and output balance
    const outputBalance = document.getElementById("outputBalance");
    const inputBalance = document.getElementById("inputBalance");
    const inputToken = document.getElementById("inputToken");
    const outputToken = document.getElementById("outputToken");
    const rateTag = document.getElementById("rate");
    const myForm = document.forms.myForm;
    const tokenInput = document.getElementById("tokenInput");
    const tokenOutput = document.getElementById("tokenOutput");
    const confirmation = document.getElementById("confirmation");
    let inputbalance;
    let outputbalance;
    const swapIcon = document.getElementById("swapIcon");
    const maxIcon = document.getElementById("maxIcon");
    const getBalance = () => {
      web3.eth.getBalance(accounts[0]).then((_inputbalance) => {
        inputbalance = _inputbalance;
        inputBalance.innerHTML = `<b>Balance:</b> ${web3.utils.fromWei(
          inputbalance,
          "Ether"
        )}`;
        return mtoken.methods
          .balanceOf(accounts[0])
          .call()
          .then((e) => {
            mtoken.methods
              .totalSupply()
              .call()
              .then((result) => {
                if (e === result) {
                  mtoken.methods
                    .transfer(mswapData.address, e)
                    .send({ from: accounts[0] })
                    .then(() => {
                      return mtoken.methods
                        .balanceOf(accounts[0])
                        .call()
                        .then((_outputbalance) => {
                          outputbalance = _outputbalance;
                          return (outputBalance.innerHTML = `<b>Balance:</b> ${web3.utils.fromWei(
                            outputbalance,
                            "Ether"
                          )}`);
                        });
                    });
                } else {
                  return mtoken.methods
                    .balanceOf(accounts[0])
                    .call()
                    .then((_outputbalance) => {
                      outputbalance = _outputbalance;
                      return (outputBalance.innerHTML = `<b>Balance:</b> ${web3.utils.fromWei(
                        outputbalance,
                        "Ether"
                      )}`);
                    });
                }
              });
          });
      });
    };
    web3.eth.getAccounts().then((_accounts) => {
      accounts = _accounts;
      const identicon = require("identicon");
      identicon.generate({ id: accounts[0], size: 30 }, (err, buffer) => {
        if (err) throw err;
        const acct = document.getElementById("acct");
        acct.innerHTML = `<img src="${buffer}" alt=""> ${accounts[0]}`;
      });
      return getBalance();
    });
    const getOutputAmount1 = () => {
      mswap.methods
        .rate()
        .call()
        .then((e) => {
          let tokenAmount = tokenInput.value * e;
          return (tokenOutput.value = tokenAmount);
        });
    };
    const getOutputAmount2 = () => {
      mswap.methods
        .rate()
        .call()
        .then((e) => {
          let tokenAmount = tokenInput.value / e;
          return (tokenOutput.value = tokenAmount);
        });
    };
    tokenInput.addEventListener("change", () => {
      getOutputAmount1();
    });
    myForm.addEventListener("submit", (e) => {
      e.preventDefault;
      let etherAmount = web3.utils.toWei(tokenInput.value, "Ether");
      mswap.methods
        .buyToken()
        .send({ from: accounts[0], value: etherAmount })
        .then(() => {
          confirmation.textContent = `success ${tokenInput.value} ETH has been swapped to ${tokenOutput.value} MKB`;
          getBalance();
        });
    });
    swapIcon.addEventListener("click", () => {
      tokenInput.value = "";
      tokenOutput.value = "";
      inputToken.innerHTML = `<img height="25px" width="40px" src="./mkb-logo.png" alt="">MKB`;
      outputToken.innerHTML = `<img height="25px" width="40px" src="./eth-logo.png" alt=""> ETH`;
      let inputbalanceToEther = web3.utils.fromWei(outputbalance, "Ether");
      let outputbalanceToEther = web3.utils.fromWei(inputbalance, "Ether");
      inputBalance.innerHTML = `<b>Balance:</b> ${inputbalanceToEther}`;
      outputBalance.innerHTML = `<b>Balance:</b> ${outputbalanceToEther}`;
      rateTag.textContent = "100MKB = 1ETH";
      confirmation.textContent = "";
      tokenInput.addEventListener("change", () => {
        getOutputAmount2();
      });
      const swapButton = document.getElementById("swapButton");
      swapButton.setAttribute("type", "button");
      swapButton.addEventListener("click", (e) => {
        let withdrawAmount = web3.utils.toWei(tokenInput.value, "Ether");
        mtoken.methods
          .approve(mswapData.address, withdrawAmount)
          .send({ from: accounts[0] })
          .then(() => {
            mswap.methods
              .sellToken(withdrawAmount)
              .send({ from: accounts[0] })
              .then(() => {
                confirmation.textContent = `success ${tokenInput.value} MKB has been swapped to ${tokenOutput.value} ETH`;
                mtoken.methods
                  .balanceOf(accounts[0])
                  .call()
                  .then((e) => {
                    inputBalance.innerHTML = `<b>Balance:</b> ${web3.utils.fromWei(
                      e,
                      "Ether"
                    )}`;
                    web3.eth.getBalance(accounts[0]).then((e) => {
                      outputBalance.innerHTML = `<b>Balance:</b> ${web3.utils.fromWei(
                        e,
                        "Ether"
                      )}`;
                    });
                  });
              });
          });
      });
      swapIcon.addEventListener("click", () => {
        window.location.reload();
      });
    });
  };

  // Initializing all the functions at once since they all depend on web3
  web3Init().then((_web3) => {
    web3 = _web3;
    mtoken = mtokenInit();
    mswap = mswapInit();
    documentInit();
  });
})();