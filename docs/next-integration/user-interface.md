---
sidebar_position: 1
---

# User Interface

This app consists of multiple components coming together to create this single screen that we will later powerup with our contract

![Demo image](../../static/img/demo.png)

## Components

For the design of this application we're keeping it simple by creating components using **Tailwind** for styling and the **DaisyUI** tailwind plugin to provide us with components.

An overview of the above screen can be found in this snippet:

```jsx
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
```

## Individual Components

Taking the above image and snippet into consideration we can go further into explaining how the components work:

### Chain Select
- This is a simple select input that allows us choose the network we want to work with.

```jsx
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
```

### Connect Wallet
- This is the button that allows us connect our wallet to our app and use it to interact with our contract.
- It also has the ability to disconnect our wallet from our app.

```jsx
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
```

### Chat Header
- This exists to indicate the name we want to call our app and also point us to an external link to see all interactions the `Greeting` contract has had since its creation.

```jsx
  return (
    <>
      <div className="bg-primary absolute top-0 left-0 p-5 w-full text-center text-black rounded-t-lg">
        <p>
          Greeter - {" "}
          <Link href={explorerLink} target="_blank" className="underline underline-offset-4">
            Explore Contract
          </Link>{" "}
        </p>
      </div>

      <div className="h-[60px]" />
    </>
  );
```

### Chat Block
- This is used displaty the last message that was sent by calling the contracts `read_title` function.

```jsx
  return (
    <>
      <ChatAvatar {...{ username }} />
      <div className="chat-bubble">{msg}</div>
    </>
  );
```

### Chat Footer
- This contains the input box we type our intended message and a send button to pass on that message by calling the contract's `set_title` method.

```jsx
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
```

### ChatAvatar
- A simple component to have an avatar image, purely for aesthetics.

```jsx
  return (
    <div className="chat-image avatar">
      <div className="w-10 rounded-full">
        <Image
          alt="Tailwind CSS chat bubble component"
          width={200}
          height={200}
          src={`https://robohash.org/${
            Boolean(props.username) ? props.username : "anon"
          }`}
          className="bg-neutral"
        />
      </div>
    </div>
  );
```

This is how our UI is built.

## Next Step

Next we will be using the package [**@stellar/stellar-sdk**](https://github.com/stellar/js-stellar-sdk) and packages from [**soroban-react**](https://soroban-react.paltalabs.io/) to tie our contract with the above interface.