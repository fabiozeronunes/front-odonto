import crypto from "node:crypto";

function sha1(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex").toUpperCase();
}

export async function isPasswordBreached(password: string): Promise<{ breached: boolean; count: number }> {
  try {
    const hash = sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });

    if (!response.ok) {
      return { breached: false, count: 0 };
    }

    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix, count] = line.split(":");
      if (hashSuffix.trim() === suffix) {
        return { breached: true, count: parseInt(count.trim(), 10) };
      }
    }

    return { breached: false, count: 0 };
  } catch {
    return { breached: false, count: 0 };
  }
}
