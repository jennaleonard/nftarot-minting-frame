/** @jsxImportSource frog/jsx */

import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { Address, encodeAbiParameters, parseAbiParameters } from "viem";
import { zoraCreator1155ImplABI } from "@zoralabs/protocol-deployments";
import { generateRandomIndex, getCardByIndex } from "@/utils/cardUtils";
import { pinata } from "frog/hubs";

const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  imageAspectRatio: "1:1",
  hub: pinata(),
  verify: "silent",
  title: "Frog Frame",
});

const randomIndex = generateRandomIndex();
const randomTokenId = BigInt(randomIndex);

app.frame("/", (c) => {
  return c.res({
    action: "/card-select",
    image: "/nftarot-frame-1.gif",
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
    image: "/nftarot-frame-2.gif",
    intents: [
      <Button action="/" value="go back">
        Go Back
      </Button>,
      <Button.Transaction target="/mint">Mint and Reveal</Button.Transaction>,
    ],
  });
});

app.transaction("/mint", (c) => {
  const quantity = BigInt(1);
  const minter = "0xd34872BE0cdb6b09d45FCa067B07f04a1A9aE1aE" as Address;
  const tokenId = randomTokenId; // we've only created 6 tokens on testnet
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
  const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
    `Here's my tarot reading for the day from NFTarot:`
  )}&embeds[]=${encodeURIComponent(
    `https://nftarot-minting-frame.vercel.app/api/card-reading-${randomTokenId}`
  )}`;

  return c.res({
    image: `/card-reading-${randomTokenId}`,
    intents: [
      <Button.Link href={shareUrl}>Share Reading</Button.Link>,
      <Button action="/" value="begin again">
        Begin Again
      </Button>,
    ],
  });
});

app.image(`/card-reading-${randomTokenId}`, async (c) => {
  const card = await getCardByIndex(Number(randomTokenId));
  console.log(c);
  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          background: "black",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
          color: "white",
          fontSize: "2rem",
        }}
      >
        <img
          src={card?.image_url}
          style={{
            width: "321px",
            height: "547px",
            border: "5px solid black",
            borderRadius: "1rem",
            margin: "0 1rem 0 6rem",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "30%",
            alignItems: "flex-start",
          }}
        >
          <p
            style={{
              fontSize: "1.75rem",
              marginBottom: "0",
              textTransform: "uppercase",
            }}
          >
            {card?.card_name}
          </p>
          <p style={{ fontSize: "1.15rem", width: "70%", marginTop: ".5rem" }}>
            {card?.card_read_main}
          </p>
        </div>
      </div>
    ),
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
