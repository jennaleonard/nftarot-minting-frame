/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from "frog";
import { devtools } from "frog/dev";
// import { neynar } from 'frog/hubs'
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import {
  Address,
  encodeAbiParameters,
  createPublicClient,
  http,
  parseAbiParameters,
  decodeEventLog,
  parseEventLogs,
} from "viem";
import { baseSepolia } from "viem/chains";
import { zoraCreator1155ImplABI } from "@zoralabs/protocol-deployments";

// getTransactionReceipt, pull logs
// decodeEventLog to get tokenId

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  title: "Frog Frame",
});

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame("/", (c) => {
  const { buttonValue, inputText, status } = c;
  const fruit = inputText || buttonValue;
  return c.res({
    action: "/card-reveal",
    image: (
      <div
        style={{
          alignItems: "center",
          background:
            status === "response"
              ? "linear-gradient(to right, #432889, #17101F)"
              : "black",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 60,
            fontStyle: "normal",
            letterSpacing: "-0.025em",
            lineHeight: 1.4,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
          }}
        >
          {status === "response"
            ? `Nice choice.${fruit ? ` ${fruit.toUpperCase()}!!` : ""}`
            : "Welcome!"}
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter custom fruit..." />,
      <Button value="apples">Apples</Button>,
      <Button value="oranges">Oranges</Button>,
      <Button value="bananas">Bananas</Button>,
      <Button.Transaction target="/mint">Mint</Button.Transaction>,
      status === "response" && <Button.Reset>Reset</Button.Reset>,
    ],
  });
});

app.transaction("/mint", (c) => {
  const { inputText } = c;
  const minter = "0xd34872BE0cdb6b09d45FCa067B07f04a1A9aE1aE" as Address;
  const tokenId = BigInt(1);
  const quantity = BigInt(1);
  const rewardsRecipients = [
    "0xD246C16EC3b555234630Ab83883aAAcdfd946ceF" as Address,
    "0xD246C16EC3b555234630Ab83883aAAcdfd946ceF" as Address,
  ];
  const minterArguments = encodeAbiParameters(
    parseAbiParameters("address x, string y"),
    [
      "0x0E1414C54161A80A18F0e7eB9576B30c20BfD0C9",
      "received a tarot reading onchain",
    ]
  );

  return c.contract({
    abi: zoraCreator1155ImplABI,
    chainId: "eip155:84532",
    functionName: "mint",
    args: [minter, tokenId, quantity, rewardsRecipients, minterArguments],
    to: "0x4B713bC4CEC525E59f5E6D1Cd3a372D0ee747E6d", //baseSepolia
    value: BigInt(777000000000000),
  });
});

app.frame("/card-reveal", async (c) => {
  const { transactionId } = c;
  const transaction = await publicClient.waitForTransactionReceipt({
    hash: transactionId as Address,
  });
  const decodeLog = parseEventLogs({
    abi: zoraCreator1155ImplABI,
    logs: transaction.logs,
  });
  console.log(decodeLog);
  return c.res({
    image: (
      <div style={{ color: "black", display: "flex", fontSize: 60 }}>
        Reveal Card ID: {transactionId}
      </div>
    ),
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);

// NOTE: That if you are using the devtools and enable Edge Runtime, you will need to copy the devtools
// static assets to the public folder. You can do this by adding a script to your package.json:
// ```json`
// {
//   scripts: {
//     "copy-static": "cp -r ./node_modules/frog/_lib/ui/.frog ./public/.frog"
//   }
// }
// ```
// Next, you'll want to set up the devtools to use the correct assets path:
// ```ts
// devtools(app, { assetsPath: '/.frog' })
// ```
