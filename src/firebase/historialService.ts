import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { HistoryEntry } from '../types'

const COLLECTION = 'historial'
const MAX_ENTRIES = 10

interface FirestoreHistoryDoc {
  fecha:          string
  fileName:       string
  totalProductos: number
  margenPromedio: number
  margenGlobal:   number
  utilidadTotal:  number
  margenMin:      number
  margenMax:      number
  products:       HistoryEntry['products']
  createdAt:      Timestamp | null
}

export async function saveHistoryEntry(entry: Omit<HistoryEntry, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...entry,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function loadHistorial(): Promise<HistoryEntry[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(MAX_ENTRIES),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data() as FirestoreHistoryDoc
    return {
      id:             d.id,
      fecha:          data.fecha,
      fileName:       data.fileName,
      totalProductos: data.totalProductos,
      margenPromedio: data.margenPromedio,
      margenGlobal:   data.margenGlobal,
      utilidadTotal:  data.utilidadTotal,
      margenMin:      data.margenMin,
      margenMax:      data.margenMax,
      products:       data.products ?? [],
    }
  })
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}

export async function clearHistorial(): Promise<void> {
  const snap = await getDocs(collection(db, COLLECTION))
  const deletes = snap.docs.map(d => deleteDoc(doc(db, COLLECTION, d.id)))
  await Promise.all(deletes)
}
