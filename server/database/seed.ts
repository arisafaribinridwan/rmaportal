import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, username } from 'better-auth/plugins'
import db from './index'
import * as schema from './schema'
import { eq } from 'drizzle-orm'

const seedAuth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    minPasswordLength: 8
  },
  plugins: [username(), admin()]
})

async function seedUsers() {
  console.log('Seeding users...')

  const role = 'ADMIN'
  const email = 'admin@example.com'
  const name = 'ADMIN'
  const password = 'password1234'
  const username = 'admin_user'

  const existing = await db.query.user.findFirst({
    where: eq(schema.user.email, email)
  })

  if (existing) {
    console.log(`User ${email} already exists. Updating role to ${role}...`)
    await db
      .update(schema.user)
      .set({ role, isActive: true })
      .where(eq(schema.user.email, email))
    console.log(`Successfully updated user ${email} with role ${role}`)
    console.log('Seeding complete.')
    process.exit(0)
  }

  try {
    console.log(`Creating user ${email}...`)
    const result = await seedAuth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        username
      }
    })

    if (result?.user?.id) {
      await db
        .update(schema.user)
        .set({ role, isActive: true })
        .where(eq(schema.user.id, result.user.id))
      console.log(`Successfully created user ${email} with role ${role}`)
    } else {
      console.error(`Failed to create user ${email}`, result)
    }
  } catch (e) {
    console.error(`Error creating user ${email}:`, e)
  }

  console.log('Seeding complete.')
  process.exit(0)
}

seedUsers().catch((e) => {
  console.error(e)
  process.exit(1)
})
