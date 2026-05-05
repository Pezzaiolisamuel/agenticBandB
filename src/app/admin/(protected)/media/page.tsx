import {
  deleteRoomImageMetadata,
  updateRoomImageMetadata,
  uploadRoomImage,
} from "@/app/admin/(protected)/media/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminMediaPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

type RoomImage = {
  id: string;
  storage_path: string;
  alt_it: string;
  alt_en: string;
  sort_order: number;
};

type RoomWithImages = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  room_images: RoomImage[] | null;
};

const mockFallbackGradients = [
  "from-brand-200 via-brand-100 to-amber-50",
  "from-emerald-100 via-teal-50 to-brand-50",
  "from-rose-100 via-orange-50 to-stone-50",
  "from-sky-100 via-cyan-50 to-stone-50",
] as const;

async function getRoomsWithImages() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(
      `
      id,
      slug,
      name_it,
      name_en,
      room_images (
        id,
        storage_path,
        alt_it,
        alt_en,
        sort_order
      )
      `,
    )
    .order("sort_order", { ascending: true })
    .order("sort_order", { foreignTable: "room_images", ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as RoomWithImages[];
}

export default async function AdminMediaPage({ searchParams }: AdminMediaPageProps) {
  const { error, success } = await searchParams;
  const rooms = await getRoomsWithImages();

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

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
          Area admin
        </p>
        <h1 className="mt-3 text-4xl leading-tight text-brand-900">Media</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Carica immagini delle camere su Supabase Storage, assegnale alle camere, modifica i testi
          alternativi bilingue e gestisci i metadati in un unico posto.
        </p>
      </div>

      <article className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-2xl text-amber-950">Configurazione bucket</h2>
        <div className="mt-3 space-y-3 text-sm leading-7 text-amber-900">
          <p>Crea un bucket Supabase Storage chiamato <code>room-images</code>.</p>
          <p>
            Per questa implementazione, rendi pubblico il bucket in modo che gli URL pubblici
            salvati possano essere mostrati direttamente nella pagina pubblica delle camere.
          </p>
          <p>
            Percorso consigliato: <code>{`<room_id>/<timestamp>-<filename>`}</code>.
          </p>
        </div>
      </article>

      <article className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl text-brand-900">Carica e assegna immagine</h2>
        <form action={uploadRoomImage} className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Camera</span>
            <select
              name="roomId"
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
              required
            >
              <option value="">Seleziona camera</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name_it}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Alt text IT</span>
            <input
              type="text"
              name="alt_it"
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Alt text EN</span>
            <input
              type="text"
              name="alt_en"
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
              required
            />
          </label>

          <div className="flex flex-col gap-3 lg:justify-end">
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">File immagine</span>
              <input
                type="file"
                name="image"
                accept="image/*"
                className="mt-2 block w-full text-sm text-stone-700"
                required
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Carica immagine
            </button>
          </div>
        </form>
      </article>

      <div className="grid gap-6">
        {rooms.map((room, roomIndex) => (
          <article
            key={room.id}
            className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl leading-tight text-brand-900">{room.name_it}</h2>
              <p className="text-sm text-stone-500">{room.name_en}</p>
              <p className="text-sm text-stone-600">Slug: {room.slug}</p>
            </div>

            {!room.room_images || room.room_images.length === 0 ? (
              <div
                className={`mt-5 rounded-[1.8rem] bg-gradient-to-br p-6 ${mockFallbackGradients[roomIndex % mockFallbackGradients.length]}`}
              >
                <div className="rounded-[1.5rem] bg-white/50 p-5 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-800/70">
                    Placeholder mock
                  </p>
                  <p className="mt-3 text-2xl text-brand-900">{room.name_it}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    Nessuna immagine e ancora assegnata a questa camera.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                {room.room_images.map((image) => (
                  <article
                    key={image.id}
                    className="overflow-hidden rounded-[1.8rem] border border-stone-200 bg-stone-50"
                  >
                    <div className="aspect-[4/3] bg-stone-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.storage_path}
                        alt={image.alt_en || image.alt_it}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="space-y-4 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Ordine: {image.sort_order}
                      </p>

                      <form action={updateRoomImageMetadata} className="space-y-4">
                        <input type="hidden" name="imageId" value={image.id} />
                        <label className="block">
                          <span className="text-sm font-semibold text-stone-700">Alt text IT</span>
                          <input
                            type="text"
                            name="alt_it"
                            defaultValue={image.alt_it}
                            className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                            required
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-semibold text-stone-700">Alt text EN</span>
                          <input
                            type="text"
                            name="alt_en"
                            defaultValue={image.alt_en}
                            className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                            required
                          />
                        </label>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
                          >
                            Salva alt text
                          </button>
                        </div>
                      </form>

                      <form action={deleteRoomImageMetadata}>
                        <input type="hidden" name="imageId" value={image.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-full border border-rose-300 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          Elimina metadati
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
