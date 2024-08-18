---
sidebar_position: 2
---

# Integrate UI with contract

Connectting our **Interface** with our **Contract**

## Contract Functions

The contract has two functions which can be called by our application:

- `read_title`
- `set_title`

To be able to access these functions, we need the contract details:

```json
[
  {
    "contractId": "greeting",
    "networkPassphrase": "Test SDF Network ; September 2015",
    "contractAddress": "CDWGVPSUXXSGABQ663FVV4TZJH4Q2R3HVAKTKWFFFMWPF23O7KMNS4KU"
  }
]
```
This is our **`deployments.json`** that indicates the address unique to this contract alone, deployed on the **testnet**.

## Interacting with the contract

To interact with our contract we need to have a wallet on the stellar network, there are a few options but for this we will be using
[Freighter Wallet](https://www.freighter.app/).

We will also be working on the test network as this is where the contract was deployed to.

With the above two understood, these are steps to interacting with out contract:

- Being able to access the network we are working with, usually called a **`chain`**
  - The testnet
- Being able to connect our wallet to the app, to sign transactions
  - In our case the sending of a message
  - Signing simply means to identify its you that carried out that action on the blockchain
- Being able to read from the blockhain via our contract

## Preparing our App

To be able to do the above, we need a way to have our app talk to blockhain. For react there is a suites of packages prefixed with **@soroban-react** that gives us:
- A Context Provider called `SorobanReactProvider`
  - Which we will use to specify:
    - The `chain(s)` we want our app to support
    - The  `contract(s)` our app will use to talk to blockhain
    - The `wallet(s)` our app will support
    - And our app name
  - This context provides us variables and functions that allows
    - Connect/Disconnect our wallet
    - Sending a messgae
    - Fetch the last message
- It also provides a hook `useRegisteredContract` to allow us select our contract that we will use to fetch the last message & send our message

> These two work together to make our application function seamlessly.

:::info

There are **more** functionalities provided by _@soroban-react_. But we'll be sticking with the above for this tutorial.

Checkout [their `docs`](https://soroban-react.paltalabs.io/).

:::

## Connecting our App
The steps below are how will be creating our app.

### Define the Soroban Context

```tsx
"use client";

import { ReactNode } from 'react'
import {SorobanReactProvider} from '@soroban-react/core';
import {testnet} from '@soroban-react/chains';
import {freighter} from '@soroban-react/freighter';
import type {ChainMetadata, Connector} from "@soroban-react/types";

import deployments from "../contract-deployments.json";

const chains: ChainMetadata[] = [testnet];
const connectors: Connector[] = [freighter()];

interface Props {
  children: ReactNode
}

const SorobanProvider = ({ children }: Props) => {
  return (
    <SorobanReactProvider
      chains={chains}
      appName={"Soroban Demo - Next.js"}
      activeChain={testnet}
      connectors={connectors}
      deployments={deployments}
    >
      {children}
    </SorobanReactProvider>
  );
}

export default SorobanProvider;
```

### Wrap our app with the Context
This goes in our app layout to wrap round everything, thereby giving every child component access to it.

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SorobanProvider from "@/components/SorobanProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Soroban Demo - Next.js",
  description: "Soroban Demo - Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SorobanProvider>{children}</SorobanProvider>
      </body>
    </html>
  );
}
```

### Enable button to `Connect/Disconnet Wallet`
With the `useSorobanReact` we now have access to:
- Functions to connect & disconnect our wallet to/from our app.

- Our wallet address

```tsx
"use client";

import { getShortAddress } from "@/utils";
import { useSorobanReact } from "@soroban-react/core";

export default function ConnectWallet () {
  const sorobanContext = useSorobanReact();

  const { address, disconnect, setActiveConnectorAndConnect, setActiveChain } = sorobanContext;
  const activeAccount = address;
  const shortAddress = getShortAddress(activeAccount);

  const browserWallets = sorobanContext.connectors;

  const handleConnect = () => {
    if (!setActiveConnectorAndConnect) return;
    setActiveConnectorAndConnect(browserWallets[0]);
  }

  const handleDisconnect = async () => {
    console.log("Disconnecting");
    await disconnect();
  }

  if (activeAccount) {
    return (
        <button
          className="bg-primary p-4 rounded-2xl text-black"
          onClick={handleDisconnect}
        >
          Account: <span className="font-bold">{shortAddress}</span>{" "}
        </button>
    );
  }

  return (
    <div>
      <button className="btn btn-accent" onClick={handleConnect}>
        Connect Wallet
      </button>
      <p className="text-[0.6rem] text-center mt-1">Freighter only</p>
    </div>
  );
};
```

### Enable our select input to `Choose Chain/Network`

- With the `useSorobanReact` we now have access to the chains we defined earlier in the creating of our context provider
- We are also able to change the chain we want to work with

```tsx
import { useSorobanReact } from "@soroban-react/core";
import { ChangeEvent } from "react";

export default function ChainSelect() {
  const sorobanContext = useSorobanReact();
  const { activeChain, setActiveChain, chains: supportedChains } = sorobanContext;

  const handleChainChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const option = e.target.value;
    const chain = supportedChains.find((chain) => chain.name === option);

    if (!chain) return;

    setActiveChain && setActiveChain(chain);
    alert(`Active chain changed to ${chain.name}`);
  };

  return (
    <select className="select select-primary" value={activeChain?.name} onChange={handleChainChange}>
      {supportedChains.map((chain) => (
        <option
          key={chain.name}
        >
          {chain.name}
        </option>
      ))}
    </select>
  );
}
```

### Create a function to call `read_title`

- This allows us to get the `greeting` contract from our intialised contracts via `useRegisteredContract`.
- We now have access to the contract details and can call its its `read_title` function.
- All of which is enables us get the last message.

```tsx
import { useRegisteredContract } from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
import { scValToNative, xdr } from "@stellar/stellar-sdk";
import { useCallback, useEffect, useState } from "react";

const useFetchLastMessage = () => {
  const contract = useRegisteredContract("greeting");
  const { server } = useSorobanReact();
  const errorMsg = "Failed to fetch. Try again later";

  const [lastMessage, setLastMessage] = useState("...");

  const fetchLastMessage = async () => {
    if (!server || !contract) return;

    try {
      const result = await contract.invoke({
        method: "read_title",
        args: [],
      });

      if (!result) return setLastMessage(errorMsg);

      // Value needs to be cast into a string as we fetch a ScVal which is not readable as is.
      // You can check out the scValConversion.tsx file to see how it's done
      const result_string = scValToNative(result as xdr.ScVal) as string;

      setLastMessage(result_string);
    } catch (e) {
      console.error(e);

      return setLastMessage(errorMsg);
    }
  };

  const cbFetchLastMessage = useCallback(fetchLastMessage, [contract, server]);

  useEffect(() => {
    cbFetchLastMessage()
  }, [cbFetchLastMessage]);

  return lastMessage;
};

export default useFetchLastMessage;
```

### Use last message from `read_title` call
- We are now able to access the last message and display it in our UI

```tsx
"use client";

import ChatHeader from "@/components/ChatHeader";
import ConnectWallet from "../components/ConnectWallet";
import ChainSelect from "@/components/ChainSelect";
import ChatFooter from "@/components/ChatFooter";
import ChatBlock from "../components/ChatBlock";
import useFetchLastMessage from "@/hooks";
import { useEffect, useState } from "react";

export default function Home() {
  const getLastMessage = useFetchLastMessage();
  const [lastMessage, setLastMessage] = useState(getLastMessage);

  useEffect(() => {
    setLastMessage(getLastMessage);
  }, [getLastMessage]);

  return (
    <main className="min-h-[100vh] flex flex-col items-center gap-4 justify-center">
      <div className="flex gap-2 justify-center">
        <ChainSelect />
        <ConnectWallet />
      </div>

      <div className="relative w-80 md:w-1/2 max-w-lg">
        <ChatHeader />

        <div className="bg-black px-4 pb-4 max-h-[400px] min-h-[200px] overflow-y-auto chat-container rounded-b-lg">
          <div className="chat-block">
            <div className="chat chat-end">
              <div className="chat-header mb-1">Last msg sent via contract</div>
              <ChatBlock username="Anon" msg={lastMessage} />
            </div>
          </div>

          <ChatFooter {...{ setLastMessage }} />
        </div>
      </div>
    </main>
  );
}
```

### Sending a message with `set_title`
- This component uses the user input as the argument for calling the contracts `set_title` function

```tsx
import { useRegisteredContract } from "@soroban-react/contracts";
import { useSorobanReact } from "@soroban-react/core";
import { nativeToScVal } from "@stellar/stellar-sdk";
import React, { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import ChatAvatar from "./ChatAvatar";
import { getShortAddress } from "@/utils";

interface Props {
  setLastMessage: Dispatch<SetStateAction<string>>
}

export default function ChatFooter(props: Props) {
  const { setLastMessage } = props;

  const { address, server } = useSorobanReact();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  const activeAccount = address;
  const shortAddress = getShortAddress(address);

  const contract = useRegisteredContract("greeting");

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSend = async () => {
    setIsSending(true);

    if (!server) {
      console.log("Server is not setup");
      alert(
        "Server is not defined. Unabled to connect to the blockchain"
      );
      return;
    }

    try {
      const result = await contract?.invoke({
        method: "set_title",
        args: [nativeToScVal(message, { type: "string" })],
        signAndSend: true,
      });

      console.log("🚀 « result:", result);
      alert("New message published");

      setMessage("");
      setLastMessage(message);
    } catch (e) {
      console.error(e);
      alert("Error while sending tx. Try again…");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-black absolute bottom-0 left-0 px-4 w-full rounded-b-lg">
      <div className="flex items-center gap-1 my-4">
        <div className="h-[40px]">
          <ChatAvatar username={shortAddress} />
        </div>

        <input
          type="text"
          placeholder="Type message here..."
          className="input w-full rounded-3xl"
          value={message}
          onChange={handleInputChange}
        />

        <button
          className="btn btn-primary rounded-3xl"
          disabled={!activeAccount || isSending}
          onClick={handleSend}
        >
          {!isSending ? "Send" : "Sending..."}
        </button>
      </div>
    </div>
  );
}
```

## Summary

Combining the above components allows us to create a fully functioning dApp.

:::tip

- Here is the [GitHub Repo](https://github.com/arndom/nextjs-soroban-app) for this tutorial.
- [Live Demo](https://next-soroban.netlify.app/)

:::
