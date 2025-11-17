import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { sync } from "../../services/sincronizarMongo.js";

export default function Books() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ id: "", title: "", author: "", year: "" });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    // cargar lista inicial de libros
    fetchBooks();
  }, []);

  async function fetchBooks() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (err) {
      console.error('fetchBooks error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    try {
      

        const {data, error } = await supabase
        .from('materialbibliografico')
        .select('*')

        const roles = data;
        console.log(roles);

        await sync(data);

      if (error) throw error;
      setBooks(prev => [...data, ...prev]);
      setForm({ id: "", title: "", author: "", year: "" });
    } catch (err) {
      console.error('handleCreate error:', err);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(book) {
    setEditing(true);
    setForm(book);
    // TODO: scroll to form / focus
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('books')
        .update({ title: form.title, author: form.author, year: parseInt(form.year) })
        .eq('id', form.id)
        .select();

      if (error) throw error;
      setBooks(prev => prev.map(b => b.id === form.id ? data[0] : b));
      setEditing(false);
      setForm({ id: "", title: "", author: "", year: "" });
    } catch (err) {
      console.error('handleUpdate error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBooks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('handleDelete error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen app-bg flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-4xl bg-white/95 rounded-2xl p-8 shadow-2xl border-l-4 border-emerald-500">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-emerald-800">Catálogo de Libros</h1>
            <p className="text-emerald-700/90 mt-1 text-sm">Crear, leer, actualizar y eliminar libros</p>
          </div>
          <div>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-emerald-500 text-white font-semibold shadow-md hover:opacity-95 transition"
            >
              Volver
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Formulario Create / Update */}
          <form onSubmit={editing ? handleUpdate : handleCreate} className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200">
            <h3 className="font-bold text-emerald-800 mb-2">{editing ? 'Editar libro' : 'Agregar libro'}</h3>

            <label className="block text-sm text-emerald-800">Título</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full mt-2 px-3 py-2 rounded-md bg-white border" />

            <label className="block text-sm text-emerald-800 mt-3">Autor</label>
            <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className="w-full mt-2 px-3 py-2 rounded-md bg-white border" />

            <label className="block text-sm text-emerald-800 mt-3">Año</label>
            <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="w-full mt-2 px-3 py-2 rounded-md bg-white border" />

            <div className="flex items-center justify-between mt-4">
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold">
                {editing ? 'Actualizar' : 'Crear'}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(false); setForm({ id: "", title: "", author: "", year: "" }); }} className="px-3 py-2 rounded-md bg-gray-200 text-gray-700">
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Lista de libros */}
          <div className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200">
            <h3 className="font-bold text-emerald-800 mb-2">Lista de libros</h3>

            {loading ? (
              <div className="text-sm text-emerald-700">Cargando...</div>
            ) : (
              <ul className="space-y-3">
                {books.map(book => (
                  <li key={book.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                    <div>
                      <div className="font-semibold text-emerald-800">{book.title}</div>
                      <div className="text-sm text-emerald-700">{book.author} — {book.year}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(book)} className="text-sm px-3 py-1 bg-amber-300 text-emerald-800 rounded-md">Editar</button>
                      <button onClick={() => handleDelete(book.id)} className="text-sm px-3 py-1 bg-red-500 text-white rounded-md">Borrar</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}