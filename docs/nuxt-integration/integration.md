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

For Nuxt there really isn't any package we can just plug in that would allow us interact with our contract. To do that we will have to work directly with the  [@stellar/stellar-sdk](https://github.com/stellar/js-stellar-sdk) to create our means of interactions.

Going forward, due to the fact that the principles for our integration interface follow similar processes to `react` we will take inspiration from [soroban-react](https://soroban-react.paltalabs.io/) to create some composables that will make our application work.

### Composables

- `useSoroban` allows us:
  - Define our intial details like:
    - The `chain(s)` we want our app to support
    - The  `contract(s)` our app will use to talk to blockhain
    - The `wallet(s)` our app will support
    - And our app name
  - Access variables & functions that enable us:
    - Connect/Disconnect our wallet
    - Sending a messgae
    - Fetch the last message
- `useFetchLastMessage` is where we have our last message string stored
- `useRegisteredContract` allows us:
  - Choose an available contract from contracts  defined in `useSoroban`
  - Access that contracts details and also makes calls to its public functions
- `useContractID` is where will be keeping our contract name which is majorly used by `useRegisteredContract`

> All these composable work together to make the app function.

:::info

The code for these **composables** are available [**`here`**](https://github.com/arndom/nuxt-soroban-app/tree/main/composables)

:::


## Connecting our App
The steps below are how will be creating our app.

### Initialize our app with needed data

```tsx
<script setup lang="ts">
  import { testnet } from '@soroban-react/chains';
  import { freighter } from '@soroban-react/freighter';
  import type { ChainMetadata, Connector } from "@soroban-react/types";

  import deployments from "./contract-deployments.json";

  const chains: ChainMetadata[] = [testnet];
  const connectors: Connector[] = [freighter()];
  const appName = "Soroban Demo - Nuxt"

  const mySorobanContext = useSoroban();
  const getContractID = useContractID();
  const lastMessage = useFetchLastMessage();

  callOnce(() => {
    mySorobanContext.value.chains = chains
    mySorobanContext.value.appName = appName
    mySorobanContext.value.activeChain = testnet
    mySorobanContext.value.connectors = connectors
    mySorobanContext.value.deployments = deployments
    getContractID.value = "greeting"
  })

  useHead({
    title: 'Soroban Demo - Nuxt',
  })
</script>

<template>
  <main class="min-h-[100vh] flex flex-col items-center gap-4 justify-center">
    <SorobanProvider>
      <div class="flex gap-2 justify-center">
        <ChainSelect />
        <ConnectWallet />
      </div>

      <div class="relative w-80 md:w-1/2 max-w-lg">
        <ChatHeader />

        <div class="bg-black px-4 pb-4 max-h-[400px] min-h-[200px] overflow-y-auto chat-container rounded-b-lg">
          <div class="chat-block">
            <div class="chat chat-end">
              <div class="chat-header mb-1">Last msg sent via contract</div>
              <ChatBlock :key="lastMessage" username="Anon" :msg="lastMessage" />
            </div>
          </div>

          <ChatFooter />
        </div>
      </div>
    </SorobanProvider>
  </main>
</template>
```

:::info

The ***`SorobanProvider`*** here is a component where we set other initial
data needed by the `useSoroban` composable and run functions in lifecycle events when updates occur.  The code for this can be found [*`here`*](https://github.com/arndom/nuxt-soroban-app/blob/main/components/SorobanProvider.vue)

:::


### Enable button to `Connect/Disconnet Wallet`
With the `useSoroban` composable we now have access to:
- Functions to connect & disconnect our wallet to/from our app.

- Our wallet address

```tsx
<script setup lang="ts">
  import { getShortAddress } from '../utils';

  const mySorobanContext = useSoroban();

  const { disconnect, setActiveConnectorAndConnect, connectors: browserWallets } = mySorobanContext.value;

  // toRef to make the address property reactive for the template
  const address = toRef(mySorobanContext.value, "address")

  const handleConnect = () => {
    if (!setActiveConnectorAndConnect) return;
    setActiveConnectorAndConnect(browserWallets[0]);
  }

  const handleDisconnect = async () => {
    console.log("Disconnecting");
    await disconnect();
  }
</script>

<template>
  <div v-if="!address">
    <button class="btn btn-accent" @click="handleConnect">
      Connect Wallet
    </button>
    <p class="text-[0.6rem] text-center mt-1">Freighter only</p>
  </div>

  <button v-else class="bg-primary p-4 rounded-2xl text-black" @click="handleDisconnect">
    Account: <span class="font-bold">{{ getShortAddress(address) }}</span>
  </button>
</template>
```

### Enable our select input to `Choose Chain/Network`

- With the `useSoroban` composable we now have access to the chains we defined earlier in our [initialization](/nuxt-integration/integration#initialize-our-app-with-needed-data).

- We are also able to change the chain we want to work with.

```tsx
<script setup lang="ts">
  const mySorobanContext = useSoroban();

  const { activeChain, setActiveChain, chains: supportedChains } = mySorobanContext.value;

  const selected = ref(activeChain?.name)

  watch(selected, () => {
    const chain = supportedChains.find((chain) => chain.name === selected.value);

    if (chain) {
      setActiveChain && setActiveChain(chain);
      alert(`Active chain changed to ${chain.name}`);
    }
  })
</script>

<template>
  <select class="select select-primary" v-model="selected">
    <option
      v-for="chain in supportedChains"
      :key="chain.name"
      :value="chain.name"
    >
      {{ chain.name }}
    </option>
  </select>
</template>
```

### Calling `read_title`

- With the contract name we defined [earlier](/nuxt-integration/integration#initialize-our-app-with-needed-data) as `greeting` we can now access the contract details and can call its `read_title` function.

```tsx
const getContract = useRegisteredContract();
const contract = getContract.value;

await callOnce(async () => {
  if (contract) {
    lastMessage.value = await fetchLastMessage(contract)
  }
})
```

### Sending a message with `set_title`
- This component uses the user input as the argument for calling the contract's `set_title` function

```tsx
<script setup lang="ts">
  import { nativeToScVal } from '@stellar/stellar-sdk';
  import { getShortAddress } from '~/utils';

  const mySorobanContext = useSoroban();
  const address = toRef(mySorobanContext.value, "address")

  const getContract = useRegisteredContract();
  const contract = getContract.value;

  const lastMessage = useFetchLastMessage();

  const isSending = ref(false);
  const message = ref("");

  const handleSend = async () => {
    isSending.value = true;

    try {
      const result = await contract?.invoke({
        method: "set_title",
        args: [nativeToScVal(message.value, { type: "string" })],
        signAndSend: true,
      });

      console.log("🚀 « result:", result);
      alert("New message published");

      lastMessage.value = message.value;
      message.value = "";
    } catch (e) {
      console.error(e);
      alert("Error while sending tx. Try again…");
    } finally {
      isSending.value = false;
    }
  }
</script>

<template>
  <div class="bg-black absolute bottom-0 left-0 px-4 w-full rounded-b-lg">
    <div class="flex items-center gap-1 my-4">
      <div class="h-[40px]">
        <ChatAvatar :username="getShortAddress(address)" />
      </div>

      <input type="text" placeholder="Type message here..." class="input w-full rounded-3xl" v-model="message" />

      <button class="btn btn-primary rounded-3xl" :disabled="!address || isSending" @click="handleSend">
        {{ !isSending ? "Send" : "Sending..."  }}
      </button>
    </div>
  </div>
</template>
```

## Conclusion

Combining the above components allows us to create a fully functioning dApp.

:::tip

- Here is the [GitHub Repo](https://github.com/arndom/nuxt-soroban-app) for this tutorial.
- [Live Demo](https://nuxt-soroban.netlify.app/)

:::

<h3>Nice job finishing this build 👏👏👏</h3>

![alt text](../../static/img/end.png)
