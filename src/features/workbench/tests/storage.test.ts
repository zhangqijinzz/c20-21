import { describe, expect, it } from 'vitest'
import { LocalWorkspaceRepository } from '../workspaceRepository'
import type { StorageService } from '../storageService'
import { createInitialDocument } from '../../../shared/models'

function memoryStorage(initial: string | null = null): StorageService {
  let value = initial
  return { read: async () => value, write: async (next) => { value = next } }
}

describe('local workspace repository', () => {
  it('round trips a document', async () => {
    const repository = new LocalWorkspaceRepository(memoryStorage())
    const document = createInitialDocument()
    await repository.save(document)
    await expect(repository.load()).resolves.toEqual(document)
  })

  it('falls back when stored JSON is damaged', async () => {
    const repository = new LocalWorkspaceRepository(memoryStorage('{broken'))
    await expect(repository.load()).resolves.toBeNull()
  })

  it('migrates legacy plans whose items have no name field', async () => {
    const legacy = JSON.stringify({
      version: 1,
      activePlanId: 'plan-1',
      plans: [{
        id: 'plan-1',
        name: '老方案',
        deskWidthMm: 1600,
        deskHeightMm: 800,
        updatedAt: '2026-09-01T00:00:00.000Z',
        items: [{ id: 'item-1', type: 'monitor', widthMm: 540, heightMm: 210, x: 0, y: 0, rotation: 0 }],
      }],
    })
    const repository = new LocalWorkspaceRepository(memoryStorage(legacy))
    const loaded = await repository.load()
    expect(loaded?.plans[0].items[0]).toMatchObject({ id: 'item-1', type: 'monitor' })
    expect(loaded?.plans[0].items[0].name).toBeUndefined()
  })
})
