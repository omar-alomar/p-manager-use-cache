import crypto from "crypto"

export const runtime = "nodejs";
export const revalidate = 0; // or: export const dynamic = "force-dynamic";

export function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password.normalize(), salt, 64, (error, hash) => { // normalizing password is important because of unicode chaos. é can be inputted/interpreted a few ways in Unicode for example e(U+301 or U+0065).
      if (error) reject(error)

      resolve(hash.toString("hex").normalize()) // resolve to a string & normalize agn before storing
    })
  })
}

export async function comparePasswords({
  password,
  salt,
  hashedPassword,
}: {
  password: string
  salt: string
  hashedPassword: string
}) {
  const inputHashedPassword = await hashPassword(password, salt)

  return crypto.timingSafeEqual(
    Buffer.from(inputHashedPassword, "hex"),
    Buffer.from(hashedPassword, "hex")
  )
}

export function generateSalt() {
  return crypto.randomBytes(16).toString("hex").normalize()
}
