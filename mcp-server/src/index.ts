import { readFile, stat } from 'node:fs/promises'
import { extname, resolve } from 'node:path'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import sharp from 'sharp'
import { z } from 'zod'

// Same limit as src/convertToWebp.ts in the app. Kept as a separate constant here
// because this tool re-reads files from disk in a Node process, not from a
// browser <input type="file"> File object.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const server = new McpServer({ name: 'webp-tools', version: '0.1.0' })

// The app's src/convertToWebp.ts relies on createImageBitmap/canvas/Blob, which
// only exist in a browser. Node has none of them, so image conversion is
// reimplemented here using sharp instead of importing that module.
server.registerTool(
  'convert_image_to_webp',
  {
    title: 'Convert image to WebP',
    description:
      'Converts a local image file to WebP format using sharp, mirroring the ' +
      "quality default (0.85) and size limit (10 MB) of this project's " +
      'browser-side converter.',
    inputSchema: {
      path: z.string().describe('Path to the source image file'),
      quality: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe('WebP quality from 0 to 1 (default 0.85)'),
      outputPath: z
        .string()
        .optional()
        .describe('Destination path (default: source path with a .webp extension)'),
    },
  },
  async ({ path, quality = 0.85, outputPath }) => {
    const sourcePath = resolve(path)

    const sourceStats = await stat(sourcePath)
    if (sourceStats.size > MAX_UPLOAD_BYTES) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `File is ${sourceStats.size} bytes, which exceeds the ${MAX_UPLOAD_BYTES} byte limit.`,
          },
        ],
      }
    }

    const buffer = await readFile(sourcePath)

    const image = sharp(buffer)
    const metadata = await image.metadata()
    if (!metadata.format) {
      return {
        isError: true,
        content: [{ type: 'text', text: `"${path}" is not a recognized image format.` }],
      }
    }

    const destinationPath =
      outputPath ?? sourcePath.slice(0, sourcePath.length - extname(sourcePath).length) + '.webp'

    await image.webp({ quality: Math.round(quality * 100) }).toFile(destinationPath)

    const destinationStats = await stat(destinationPath)
    const reductionPercent = (
      (1 - destinationStats.size / sourceStats.size) *
      100
    ).toFixed(1)

    return {
      content: [
        {
          type: 'text',
          text:
            `Converted "${sourcePath}" (${sourceStats.size} bytes) to ` +
            `"${destinationPath}" (${destinationStats.size} bytes), ` +
            `a ${reductionPercent}% reduction.`,
        },
      ],
    }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
