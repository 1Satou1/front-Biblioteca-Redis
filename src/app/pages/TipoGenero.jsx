import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../../services/supabaseClient.js';

export default function TipoGenero() {
  const navigate = useNavigate();

  // tipos
  const [tipos, setTipos] = useState([]);
  const [tipoForm, setTipoForm] = useState({ id: "", tipo: "" });
  const [tiposLoading, setTiposLoading] = useState(false);
  const [editingTipo, setEditingTipo] = useState(false);
  const [tipoError, setTipoError] = useState("");

  // generos
  const [generos, setGeneros] = useState([]);
  const [generoForm, setGeneroForm] = useState({ id: "", clasificacion: "" });
  const [generosLoading, setGenerosLoading] = useState(false);
  const [editingGenero, setEditingGenero] = useState(false);
  const [generoError, setGeneroError] = useState("");

  useEffect(() => {
    fetchTipos();
    fetchGeneros();
  }, []);

  // TIPOS CRUD
  async function fetchTipos() {
    setTiposLoading(true);
    try {
      const { data, error } = await supabase.from('tipomaterial').select('*').order('id', { ascending: false });
      if (error) throw error;
      setTipos(data ?? []);
    } catch (err) {
      console.error('fetchTipos error:', err);
    } finally {
      setTiposLoading(false);
    }
  }

  function validateTipoForm() {
    if (!tipoForm.tipo || !tipoForm.tipo.trim()) {
      setTipoError('El nombre del tipo es obligatorio.');
      return false;
    }
    const normalizedInput = tipoForm.tipo.toLowerCase().trim();
    const isDuplicate = tipos.some(t => t.tipo.toLowerCase().trim() === normalizedInput && t.id !== tipoForm.id);
    if (isDuplicate) {
      setTipoError('Este tipo ya existe.');
      return false;
    }
    setTipoError('');
    return true;
  }

  async function createTipo(e) {
    e.preventDefault();
    if (!validateTipoForm()) return;
    try {
      const { data, error } = await supabase.from('tipomaterial').insert([{ tipo: tipoForm.tipo }]).select();
      if (error) throw error;
      const inserted = (data || [])[0];
      if (inserted) {
        setTipos(prev => [inserted, ...prev]);
        setTipoForm({ id: "", tipo: "" });
      }
    } catch (err) {
      console.error('createTipo error:', err);
    }
  }

  function startEditTipo(item) {
    setEditingTipo(true);
    setTipoForm({ id: item.id, tipo: item.tipo });
    setTipoError('');
  }

  async function updateTipo(e) {
    e.preventDefault();
    if (!validateTipoForm()) return;
    try {
      const { data, error } = await supabase.from('tipomaterial').update({ tipo: tipoForm.tipo }).eq('id', tipoForm.id).select();
      if (error) throw error;
      const updated = (data || [])[0];
      if (updated) setTipos(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditingTipo(false);
      setTipoForm({ id: "", tipo: "" });
    } catch (err) {
      console.error('updateTipo error:', err);
    }
  }

  async function deleteTipo(id) {
    if (!confirm('¿Borrar este tipo?')) return;
    try {
      const { error } = await supabase.from('tipomaterial').delete().eq('id', id);
      if (error) throw error;
      setTipos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('deleteTipo error:', err);
    }
  }

  // GENEROS CRUD
  async function fetchGeneros() {
    setGenerosLoading(true);
    try {
      const { data, error } = await supabase.from('material_genero').select('*').order('id_genero', { ascending: false });
      if (error) throw error;
      setGeneros(data ?? []);
    } catch (err) {
      console.error('fetchGeneros error:', err);
    } finally {
      setGenerosLoading(false);
    }
  }

  function validateGeneroForm() {
    if (!generoForm.clasificacion || !generoForm.clasificacion.trim()) {
      setGeneroError('La clasificación del género es obligatoria.');
      return false;
    }
    const normalizedInput = generoForm.clasificacion.toLowerCase().trim();
    const isDuplicate = generos.some(g => g.clasificacion.toLowerCase().trim() === normalizedInput && g.id_genero !== generoForm.id);
    if (isDuplicate) {
      setGeneroError('Este género ya existe.');
      return false;
    }
    setGeneroError('');
    return true;
  }

  async function createGenero(e) {
    e.preventDefault();
    if (!validateGeneroForm()) return;
    try {
      const { data, error } = await supabase.from('material_genero').insert([{ clasificacion: generoForm.clasificacion }]).select();
      if (error) throw error;
      const inserted = (data || [])[0];
      if (inserted) {
        setGeneros(prev => [inserted, ...prev]);
        setGeneroForm({ id: "", clasificacion: "" });
      }
    } catch (err) {
      console.error('createGenero error:', err);
    }
  }

  function startEditGenero(item) {
    setEditingGenero(true);
    setGeneroForm({ id: item.id_genero, clasificacion: item.clasificacion });
    setGeneroError('');
  }

  async function updateGenero(e) {
    e.preventDefault();
    if (!validateGeneroForm()) return;
    try {
      const { data, error } = await supabase.from('material_genero').update({ clasificacion: generoForm.clasificacion }).eq('id_genero', generoForm.id).select();
      if (error) throw error;
      const updated = (data || [])[0];
      if (updated) setGeneros(prev => prev.map(g => g.id_genero === updated.id_genero ? updated : g));
      setEditingGenero(false);
      setGeneroForm({ id: "", clasificacion: "" });
    } catch (err) {
      console.error('updateGenero error:', err);
    }
  }

  async function deleteGenero(id) {
    if (!confirm('¿Borrar este género?')) return;
    try {
      const { error } = await supabase.from('material_genero').delete().eq('id_genero', id);
      if (error) throw error;
      setGeneros(prev => prev.filter(g => g.id_genero !== id));
    } catch (err) {
      console.error('deleteGenero error:', err);
    }
  }

  return (
    <div className="min-h-screen app-bg flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-5xl bg-white/95 rounded-2xl p-6 shadow-lg border-l-4 border-emerald-500">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-emerald-800">Administrar Tipos y Géneros</h1>
            <p className="text-emerald-700/90 mt-1 text-sm">Crea, edita y elimina Tipos de Material y Géneros</p>
          </div>
          <div>
            <button onClick={() => navigate('/home')} className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-emerald-500 text-white font-semibold shadow-md hover:opacity-95 transition">Volver</button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipos */}
          <div className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200">
            <h2 className="font-bold text-emerald-800 mb-3">Tipos de material</h2>
            <form onSubmit={editingTipo ? updateTipo : createTipo} className="space-y-2">
              <input
                value={tipoForm.tipo}
                onChange={e => setTipoForm(f => ({ ...f, tipo: e.target.value }))}
                placeholder="Nombre del tipo"
                className="w-full px-3 py-2 rounded-md border bg-white"
                required
              />
              {tipoError && <div className="text-sm text-red-600">{tipoError}</div>}
              <div className="flex gap-2">
                <button type="submit" className="px-3 py-2 bg-emerald-600 text-white rounded-md">{editingTipo ? 'Actualizar' : 'Agregar'}</button>
                {editingTipo && <button type="button" onClick={() => { setEditingTipo(false); setTipoForm({ id: "", tipo: "" }); setTipoError(''); }} className="px-3 py-2 rounded-md bg-gray-200">Cancelar</button>}
              </div>
            </form>

            <div className="mt-4">
              <h3 className="font-medium text-emerald-800 mb-2">Lista</h3>
              {tiposLoading ? <div className="text-sm text-emerald-700">Cargando tipos...</div> : (
                <ul className="space-y-2">
                  {tipos.map(t => (
                    <li key={t.id} className="flex items-center justify-between bg-white p-2 rounded-md border">
                      <div>{t.tipo}</div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditTipo(t)} className="px-2 py-1 bg-amber-300 text-emerald-800 rounded-md">Editar</button>
                        <button onClick={() => deleteTipo(t.id)} className="px-2 py-1 bg-red-500 text-white rounded-md">Borrar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Generos */}
          <div className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200">
            <h2 className="font-bold text-emerald-800 mb-3">Géneros</h2>
            <form onSubmit={editingGenero ? updateGenero : createGenero} className="space-y-2">
              <input
                value={generoForm.clasificacion}
                onChange={e => setGeneroForm(f => ({ ...f, clasificacion: e.target.value }))}
                placeholder="Nombre del género"
                className="w-full px-3 py-2 rounded-md border bg-white"
                required
              />
              {generoError && <div className="text-sm text-red-600">{generoError}</div>}
              <div className="flex gap-2">
                <button type="submit" className="px-3 py-2 bg-emerald-600 text-white rounded-md">{editingGenero ? 'Actualizar' : 'Agregar'}</button>
                {editingGenero && <button type="button" onClick={() => { setEditingGenero(false); setGeneroForm({ id: "", clasificacion: "" }); setGeneroError(''); }} className="px-3 py-2 rounded-md bg-gray-200">Cancelar</button>}
              </div>
            </form>

            <div className="mt-4">
              <h3 className="font-medium text-emerald-800 mb-2">Lista</h3>
              {generosLoading ? <div className="text-sm text-emerald-700">Cargando géneros...</div> : (
                <ul className="space-y-2">
                  {generos.map(g => (
                    <li key={g.id_genero} className="flex items-center justify-between bg-white p-2 rounded-md border">
                      <div>{g.clasificacion}</div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditGenero(g)} className="px-2 py-1 bg-amber-300 text-emerald-800 rounded-md">Editar</button>
                        <button onClick={() => deleteGenero(g.id_genero)} className="px-2 py-1 bg-red-500 text-white rounded-md">Borrar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
