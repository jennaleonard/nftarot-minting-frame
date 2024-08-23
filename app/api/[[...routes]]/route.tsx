/** @jsxImportSource frog/jsx */

import { Button, Frog } from "frog";
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
  parseEventLogs,
} from "viem";
import { baseSepolia } from "viem/chains";
import { zoraCreator1155ImplABI } from "@zoralabs/protocol-deployments";
import { generateRandomIndex, getCardByIndex } from "@/utils/cardUtils";
import { createReading } from "@/utils/dbUtils";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export const colors = { purple: "#6D2AFB", yellow: "#FFC700" };

const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  imageAspectRatio: "1:1",
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  title: "Frog Frame",
});

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame("/", (c) => {
  return c.res({
    action: "/card-select",
    image: (
      <div
        style={{
          alignItems: "center",
          background: colors.purple,
          color: "black",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
          fontSize: "2em",
        }}
      >
        <img
          src={"/frames-card-back.png"}
          style={{
            width: "280px",
            height: "425px",
            marginBottom: "1rem",
          }}
        />
        Mint a tarot reading onchain!
      </div>
    ),
    intents: [
      <Button value="begin reading">Begin Reading</Button>,
      <Button.Link href="https://www.nftarot.com/about">
        Learn More
      </Button.Link>,
    ],
  });
});

app.frame("/card-select", (c) => {
  return c.res({
    action: "/card-reveal",
    image: (
      <div
        style={{
          alignItems: "center",
          background: colors.purple,
          backgroundSize: "100%",
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
            background: colors.yellow,
            width: "40%",
            height: "80%",
            border: "5px solid black",
            borderRadius: "2rem",
            color: "black",
            fontSize: "2.5rem",
            textWrap: "wrap",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          Take a deep breath. Set your intention. When you're ready, mint your
          reading.
        </div>
      </div>
    ),
    intents: [
      <Button action="/" value="go back">
        Go Back
      </Button>,
      <Button.Transaction target="/mint">Mint</Button.Transaction>,
    ],
  });
});

app.transaction("/mint", (c) => {
  const randomIndex = generateRandomIndex();
  const minter = "0xd34872BE0cdb6b09d45FCa067B07f04a1A9aE1aE" as Address;
  const tokenId = BigInt(6); // we've only created 6 tokens on testnet, randomIndex will apply later
  const quantity = BigInt(1);
  const rewardsRecipients = [
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
  // select the cardToken and wallet from the transaction
  const transaction = await publicClient.waitForTransactionReceipt({
    hash: transactionId as Address,
  });
  const decodeLog = parseEventLogs({
    abi: zoraCreator1155ImplABI,
    logs: transaction.logs,
  });
  // the wallet and tokenId can be found in "Purchased"
  const purchasedEvent = decodeLog.filter(
    (event) => event.eventName === "Purchased"
  );
  const cardTokenId = purchasedEvent[0].args.tokenId;
  const senderWallet = purchasedEvent[0].args.sender;
  const card = await getCardByIndex(Number(cardTokenId));
  let framesReadingId;
  if (card) {
    framesReadingId = await createReading(
      senderWallet,
      card?.card_id,
      card?.deck_id,
      card?.image_url,
      Number(cardTokenId)
    );
  }

  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          background: colors.purple,
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
          color: "black",
          fontSize: "2rem",
        }}
      >
        <img
          src={card?.image_url}
          style={{
            width: "284px",
            height: "426px",
            border: "5px solid black",
            borderRadius: "1rem",
            marginBottom: "1rem",
          }}
        />
        {card?.card_name}
      </div>
    ),
    intents: [
      <Button.Link href={`https://nftarot.com/card-reveal/${framesReadingId}`}>
        Expand Reading
      </Button.Link>,
      <Button action="/" value="share">
        Share
      </Button>,
      <Button action="/" value="new reading">
        New Reading
      </Button>,
    ],
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
