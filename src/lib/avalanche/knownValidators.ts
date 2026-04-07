/**
 * Known Avalanche Validator Registry
 *
 * Maps NodeID → organization name.
 * The Avalanche network has no on-chain name registry (unlike Solana/Sui),
 * so this curated list is built from verified public sources:
 * official websites, staking guides, GitHub docs, block explorers.
 *
 * Last updated: 2026-04-07
 * Coverage: ~100 nodes (74 Ava Labs genesis + 26 institutional)
 *
 * To add a validator: append { "NodeID-XXX": "Company Name" } with a source comment.
 * Prompts for Grok research: search Twitter/X for "our avalanche nodeID" or "[company] avax validator"
 */

export const KNOWN_AVALANCHE_VALIDATORS: Record<string, string> = {

    // ── Ava Labs — Genesis Validators (74 nodes from genesis_mainnet.json) ──────
    // Source: https://github.com/ava-labs/avalanchego/blob/master/genesis/genesis_mainnet.json
    "NodeID-A6onFGyJjA37EZ7kYHANMR1PFRT8NmXrF": "Ava Labs",
    "NodeID-6SwnPJLH8cWfrJ162JjZekbmzaFpjPcf":  "Ava Labs",
    "NodeID-GSgaA47umS1px2ohVjodW9621Ks63xDxD": "Ava Labs",
    "NodeID-BQEo5Fy1FRKLbX51ejqDd14cuSXJKArH2": "Ava Labs",
    "NodeID-Drv1Qh7iJvW3zGBBeRnYfCzk56VCRM2GQ": "Ava Labs",
    "NodeID-DAtCoXfLT6Y83dgJ7FmQg8eR53hz37J79": "Ava Labs",
    "NodeID-FGRoKnyYKFWYFMb6Xbocf4hKuyCBENgWM": "Ava Labs",
    "NodeID-Dw7tuwxpAmcpvVGp9JzaHAR3REPoJ8f2R": "Ava Labs",
    "NodeID-4kCLS16Wy73nt1Zm54jFZsL7Msrv3UCeJ": "Ava Labs",
    "NodeID-9T7NXBFpp8LWCyc58YdKNoowDipdVKAWz": "Ava Labs",
    "NodeID-6ghBh6yof5ouMCya2n9fHzhpWouiZFVVj": "Ava Labs",
    "NodeID-HiFv1DpKXkAAfJ1NHWVqQoojjznibZXHP": "Ava Labs",
    "NodeID-Fv3t2shrpkmvLnvNzcv1rqRKbDAYFnUor": "Ava Labs",
    "NodeID-AaxT2P4uuPAHb7vAD8mNvjQ3jgyaV7tu9": "Ava Labs",
    "NodeID-kZNuQMHhydefgnwjYX1fhHMpRNAs9my1":  "Ava Labs",
    "NodeID-A7GwTSd47AcDVqpTVj7YtxtjHREM33EJw": "Ava Labs",
    "NodeID-Hr78Fy8uDYiRYocRYHXp4eLCYeb8x5UuM": "Ava Labs",
    "NodeID-9CkG9MBNavnw7EVSRsuFr7ws9gascDQy3": "Ava Labs",
    "NodeID-A8jypu63CWp76STwKdqP6e9hjL675kdiG": "Ava Labs",
    "NodeID-HsBEx3L71EHWSXaE6gvk2VsNntFEZsxqc": "Ava Labs",
    "NodeID-Nr584bLpGgbCUbZFSBaBz3Xum5wpca9Ym": "Ava Labs",
    "NodeID-QKGoUvqcgormCoMj6yPw9isY7DX9H4mdd": "Ava Labs",
    "NodeID-HCw7S2TVbFPDWNBo1GnFWqJ47f9rDJtt1": "Ava Labs",
    "NodeID-FYv1Lb29SqMpywYXH7yNkcFAzRF2jvm3K": "Ava Labs",
    "NodeID-7Coo9eki57kLLpAomUeKHR49DVDtve1rW": "Ava Labs",
    "NodeID-GXrrnggKkYmEsNLFc7utBekRjdz1pBr94": "Ava Labs",
    "NodeID-NJxR7FwisMtZ3GAXA6jfwyycdqgLD6u6w": "Ava Labs",
    "NodeID-4ZtjFSZbyaBH7VYmpzv9itjjnCUXXB4SJ": "Ava Labs",
    "NodeID-KLgc2i9FqXWjvCc7cX9V1WRYejNu9Skr5": "Ava Labs",
    "NodeID-FVtZkETZyHPgX4i3VXKAA7VPsNP9PGdyy": "Ava Labs",
    "NodeID-MKzXHL5FgrZ92RfjZx76X9QWCw1Z9XUhs": "Ava Labs",
    "NodeID-KcGCZ7uJDU1RUpfr4bm8eXiSxF85iBaSS": "Ava Labs",
    "NodeID-HntcdvtNyPvtfSBn7RCdVEJbCZuhVHMrc": "Ava Labs",
    "NodeID-4THSbiM2YZQUyYSseUN9w9suaG3xmPs6R": "Ava Labs",
    "NodeID-5Zu8Jxbg6HDzqUFPLTakFydb1ToAwqde8": "Ava Labs",
    "NodeID-J7FNHrEt2AX5Zos6PxWxaPiKBUkxUAxqE": "Ava Labs",
    "NodeID-Pu5SGCYS3hxAeqCtmuP82mFVTDQAmzWeF": "Ava Labs",
    "NodeID-F2gXNmQE8HbhD8wJZYK3E466WkMDovNhW": "Ava Labs",
    "NodeID-GcU6q4WWVnaBwAfeuKWohbsUDb6vcphNp": "Ava Labs",
    "NodeID-Bn3EzrkXLAZ2R9JwE9iQzbwDLaRdoPbJm": "Ava Labs",
    "NodeID-DEAQLJUAQnGcDYAejsL4aestnx6EcGMDC": "Ava Labs",
    "NodeID-JpSbAFWbh6BSMHaLBeeVy8GUUyBJfx2HZ": "Ava Labs",
    "NodeID-MAv2M27MKWWygQ4mfDH3HArr3Sx2z7EFS": "Ava Labs",
    "NodeID-87VEJfHfQemDd9kf7vWpBTTJwEADiPwSx": "Ava Labs",
    "NodeID-Lvvtgieb1ugbhF9XxBMWHtcb2kBwqzb9u": "Ava Labs",
    "NodeID-4C14DCL7eKVSnnvzN5X3EupQhMru7BCoJ": "Ava Labs",
    "NodeID-M7MLNJeXMtJT5hURJkmnnrp6g3nzrkBq3": "Ava Labs",
    "NodeID-5tMfoV9w5aRZsvUicCnpvbG3YiYmxJtwq": "Ava Labs",
    "NodeID-AFZ1tj1U2N8A7yfDgaZs5F3nZLSakrkKZ": "Ava Labs",
    "NodeID-BZagW7bQN98PeqvTDsEyx4NAC6iwxAaDD": "Ava Labs",
    "NodeID-NT7j7scLgNmdUcA3wLBfLGhHZyLFQgXWJ": "Ava Labs",
    "NodeID-5UsA7b3WUcVMZY6cHrd6YE19QvrMsgCL4": "Ava Labs",
    "NodeID-3h8popa4K8WLgXLtgbF8j5botxZn9pxCk": "Ava Labs",
    "NodeID-2KoiHvgF4w3vpcpCQJx1TS1jhvUNUv1Di": "Ava Labs",
    "NodeID-oHepztt2XZVe4hNEdcDTRPLDFe1dDrvv":  "Ava Labs",
    "NodeID-EhfEzYtoLFvi9jxGVsuUm9Cxp17XP9KTV": "Ava Labs",
    "NodeID-F39j9w849PybQ77ZTW7yT5vwW4RqvLDU7": "Ava Labs",
    "NodeID-CjATSW5HDSDDmMW3WBsxFZVmmHxJhPaLf": "Ava Labs",
    "NodeID-FzoZsxHsZ9fvQweVLYCRkrxhNA9871va5": "Ava Labs",
    "NodeID-D87m2bQzEg9rquqT72zHp9BffaismCzKJ": "Ava Labs",
    "NodeID-P1t1oaVm3jFpJpULAp3kjbpoXCWdqfQzs": "Ava Labs",
    "NodeID-29sgUazwvdr4UWUw7twNtxdPsgRa4Qtyx": "Ava Labs",
    "NodeID-738ej1TyMQDVYfCnYbWpnfkPtrqYMDx1i": "Ava Labs",
    "NodeID-A68KFvmn6kR4q5XAvEyHseFaKZWEr4hVY": "Ava Labs",
    "NodeID-LC2MkvPkGBwehNYZ4UZ83MFQ7rPPQrhsc": "Ava Labs",
    "NodeID-MeFQ9uUwZaTxES5dZyxmChwUpnj6CWDBh": "Ava Labs",
    "NodeID-KJWaiZPLcgCW6iPvKYTE1ekMZ6F9G9NLa": "Ava Labs",
    "NodeID-6u8G2WE6Kb3K6d1fXWmFQyDBoL4dGnCN":  "Ava Labs",
    "NodeID-J8RBUNXW3pXWyr6Wk7x3GTDntHxcR2vJF": "Ava Labs",
    "NodeID-PocSTWaz3HJLcnpKVR3MUmaE8zc9nJPzg": "Ava Labs",
    "NodeID-NNCuqkczH7E13ob75z9bZh86jWaH3ZjYA": "Ava Labs",
    "NodeID-FjXxUM6axBx1GSiatQdqeF1YgZQzpmbkE": "Ava Labs",
    "NodeID-6iresvQ2F4jrjYAR8ZL4HBrM5bFYvPvyr": "Ava Labs",
    "NodeID-BHK7drcmNhLnePTFwWXaQNRMVB4MrJLzU": "Ava Labs",
    "NodeID-L7WQizfKW9Y1GZdL9oxKtp5QzgYhViySP": "Ava Labs",

    // ── Institutional Staking Providers ─────────────────────────────────────────

    // Figment — Source: figment.io/staking/protocols/avalanche/
    "NodeID-2QkqmQatgiw5v6otZehA7dZxUKKp8tB7e": "Figment",

    // Chorus One (4 nodes) — Source: kb.chorus.one + github.com/ChorusOne/docs
    "NodeID-LkDLSLrAW1E7Sga1zng17L1AqrtkyWTGg": "Chorus One",
    "NodeID-4Ubqsj2vfwdGUUYNg1jtYpkYNNLugNBQ9": "Chorus One",
    "NodeID-MTEbgxTNBdL6GWh8SdQMfMXvEU1jC9aws": "Chorus One",
    "NodeID-N4zuaXKz9tpBax2YVqAXoducH1SugH4ZF": "Chorus One",

    // P2P.org — Source: p2p.org AVAX delegation guide
    "NodeID-7CCynVtyQVRBTCjzpfrsrSuaCTjXw7o3G": "P2P.org",

    // Coinbase Cloud — Source: docs.cdp.coinbase.com + Avascan "Coinbase Cloud Public Validator"
    "NodeID-CiKdcSyNH27re2W17ygscpZ4xG7474E5U": "Coinbase Cloud",

    // Luganodes — Source: luganodes.com/blog/AVAXSG + X @luganodes
    "NodeID-95rcDYyjGNKckKCF8PKuTyEV1wxkQvP3n": "Luganodes",

    // Blockdaemon — Source: blockdaemon.com/protocols/avalanche
    "NodeID-6J3LY7ojkK7WCZzmArvxEozaESDMb42hX": "Blockdaemon",

    // Ankr (3 nodes) — Source: ankrlabs.xyz/validators/avalanche/
    "NodeID-955GU1MqWL8yXAtoc8AsE7FNx4nGC9JyL": "Ankr",
    "NodeID-NcZtrWEjPY7XDT5PHgZbwXLCW3LGBjxui": "Ankr",
    "NodeID-9CnrQBBFSkE2Xzfcz3Tk1e8iauq8iNR88": "Ankr",

    // Allnodes (4 nodes) — Source: Avascan labels "ALLNODES⚡️1/2/3" + help.allnodes.com
    "NodeID-PqPwxtYAt6AmikigAwkRzTQCaeMqPvpff": "Allnodes",
    "NodeID-GGHpri3tVbRgLUEFKqxNivRbegTKBAnyG": "Allnodes",
    "NodeID-FtJRoxeiXq4D4hsM9PCAZkoerJDTqPEW7": "Allnodes",
    "NodeID-DircSAEQ2VMVNTDqyc8fdTFDDaWdAm5re": "Allnodes",

    // SenseiNode (4 nodes) — Source: senseinode.com/en-stake/avalanche (Nigeria, Mexico, Brazil)
    "NodeID-2Coj79FAu7rPdSdYdJ27CqTr1K2p45gze": "SenseiNode",
    "NodeID-8mirL2rorHYSEbkBxu8TwodvpN29RrNY3": "SenseiNode",
    "NodeID-9Efcx2E5uEHZqZSTWT1jPd8DfEkJaZeGj": "SenseiNode",
    "NodeID-F3SZA2ZNdRjTBe3GYyRQFDaCXB3DyaZQQ": "SenseiNode",

    // Stakely — Source: stakely.io AVAX staking guide
    "NodeID-6na5rkzi37wtt5piHV62y11XYfN2kTsTH": "Stakely",

    // Northstake — Source: medium.com/northstake AVAX delegation guide
    "NodeID-Nn7JvyqWEeEXbFGx63vwJRngQwaUnBF3R": "Northstake",

};

/**
 * Look up the organization name for a given Avalanche NodeID.
 * Returns undefined if not in the registry — caller should fall back to a short NodeID.
 */
export function getKnownValidatorName(nodeID: string): string | undefined {
    return KNOWN_AVALANCHE_VALIDATORS[nodeID];
}
