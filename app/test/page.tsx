import { neon } from "@neondatabase/serverless"
import { headers } from "next/headers"

export default async function TestPage() {
  const headersList = headers()
  const domain = headersList.get("host") || "localhost:3000"

  let dbResult = "Not tested"
  let error = null

  try {
    const sql = neon(process.env.DATABASE_URL || "")
    const result = await sql`SELECT COUNT(*) FROM "User"`
    dbResult = JSON.stringify(result)
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">System Test Page</h1>

      <div className="space-y-6">
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Environment</h2>
          <p>
            <strong>Node Environment:</strong> {process.env.NODE_ENV}
          </p>
          <p>
            <strong>Current Domain:</strong> {domain}
          </p>
          <p>
            <strong>NEXTAUTH_URL Set:</strong> {process.env.NEXTAUTH_URL ? "Yes" : "No"}
          </p>
          <p>
            <strong>DATABASE_URL Set:</strong> {process.env.DATABASE_URL ? "Yes (hidden)" : "No"}
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Database Connection Test</h2>
          <p>
            <strong>Result:</strong> {dbResult}
          </p>
          {error && (
            <div className="mt-2 p-3 bg-red-50 text-red-700 rounded border border-red-200">
              <p>
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
