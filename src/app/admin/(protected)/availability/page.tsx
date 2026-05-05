import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
} from "@/app/admin/(protected)/availability/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminAvailabilityPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

type RoomOption = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  is_active: boolean;
};

type AvailabilityBlock = {
  id: string;
  room_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  created_by: string;
  created_at: string;
  rooms: {
    id: string;
    slug: string;
    name_it: string;
    name_en: string;
  }[] | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

async function getAvailabilityWorkspaceData() {
  const supabase = createSupabaseAdminClient();

  const [{ data: roomsData, error: roomsError }, { data: blocksData, error: blocksError }] =
    await Promise.all([
      supabase
        .from("rooms")
        .select("id, slug, name_it, name_en, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("availability_blocks")
        .select(
          `
          id,
          room_id,
          start_date,
          end_date,
          reason,
          created_by,
          created_at,
          rooms (
            id,
            slug,
            name_it,
            name_en
          )
          `,
        )
        .order("start_date", { ascending: true }),
    ]);

  if (roomsError) {
    throw roomsError;
  }

  if (blocksError) {
    throw blocksError;
  }

  return {
    rooms: (roomsData ?? []) as RoomOption[],
    blocks: (blocksData ?? []) as AvailabilityBlock[],
  };
}

export default async function AdminAvailabilityPage({
  searchParams,
}: AdminAvailabilityPageProps) {
  const { error, success } = await searchParams;

  let rooms: RoomOption[] = [];
  let blocks: AvailabilityBlock[] = [];
  let dataError: string | null = null;

  try {
    const data = await getAvailabilityWorkspaceData();
    rooms = data.rooms;
    blocks = data.blocks;
  } catch (fetchError) {
    dataError =
      fetchError instanceof Error
        ? fetchError.message
        : "Impossibile caricare l'area disponibilita in questo momento.";
  }

  return (
    <section className="space-y-8">
      {error ? (
        <article className="rounded-[1.6rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </article>
      ) : null}
      {success ? (
        <article className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {success}
        </article>
      ) : null}
      {dataError ? (
        <article className="rounded-[1.6rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {dataError}
        </article>
      ) : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
          Area admin
        </p>
        <h1 className="mt-3 text-4xl leading-tight text-brand-900">Disponibilita</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Crea chiusure manuali per manutenzione, uso privato o esigenze eccezionali, poi
          controlla e rimuovi i blocchi futuri delle camere in un unico posto.
        </p>
      </div>

      <article className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
            Crea blocco disponibilita
          </p>
          <h2 className="text-2xl text-brand-900">Chiudi una camera per le date selezionate</h2>
        </div>

        {rooms.length === 0 ? (
          <div className="mt-5 rounded-[1.6rem] border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-700">
            Non ci sono ancora camere attive disponibili. Aggiungi o riattiva una camera prima di
            creare blocchi di disponibilita.
          </div>
        ) : (
          <form action={createAvailabilityBlock} className="mt-5 rounded-[1.6rem] bg-stone-50 p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block xl:col-span-1">
                <span className="text-sm font-semibold text-stone-700">Camera</span>
                <select
                  name="roomId"
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                  required
                >
                  <option value="">Seleziona una camera</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name_it} ({room.slug})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">Data inizio</span>
                <input
                  type="date"
                  name="start_date"
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">Data fine</span>
                <input
                  type="date"
                  name="end_date"
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                  required
                />
              </label>

              <label className="block md:col-span-2 xl:col-span-1">
                <span className="text-sm font-semibold text-stone-700">Motivo</span>
                <input
                  type="text"
                  name="reason"
                  placeholder="Manutenzione, soggiorno privato, evento..."
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                  required
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Crea blocco
            </button>
          </form>
        )}
      </article>

      <article className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
              Blocchi esistenti
            </p>
            <h2 className="text-2xl text-brand-900">Chiusure manuali attuali</h2>
          </div>
          <p className="text-sm text-stone-500">
            {blocks.length} blocc{blocks.length === 1 ? "o" : "hi"} nel sistema
          </p>
        </div>

        {blocks.length === 0 ? (
          <div className="mt-5 rounded-[1.6rem] border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-700">
            Nessun blocco di disponibilita e stato ancora creato.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-stone-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 sm:px-5">
                    Camera
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 sm:px-5">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 sm:px-5">
                    Motivo
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 sm:px-5">
                    Creato da
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 sm:px-5">
                    Azione
                  </th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => {
                  const room = block.rooms?.[0] ?? null;

                  return (
                    <tr key={block.id} className="border-t border-stone-200">
                      <td className="px-4 py-4 text-sm text-stone-700 sm:px-5">
                        <div className="font-semibold text-brand-900">
                          {room?.name_it ?? "Camera sconosciuta"}
                        </div>
                        <div className="mt-1 text-xs text-stone-500">
                          {room?.slug ?? block.room_id}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-stone-700 sm:px-5">
                        {formatDate(block.start_date)} al {formatDate(block.end_date)}
                      </td>
                      <td className="px-4 py-4 text-sm text-stone-700 sm:px-5">
                        {block.reason}
                      </td>
                      <td className="px-4 py-4 text-sm text-stone-700 sm:px-5">
                        <div>{block.created_by}</div>
                        <div className="mt-1 text-xs text-stone-500">
                          Aggiunto il{" "}
                          {new Intl.DateTimeFormat("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(block.created_at))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm sm:px-5">
                        <form action={deleteAvailabilityBlock}>
                          <input type="hidden" name="blockId" value={block.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            Elimina
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
