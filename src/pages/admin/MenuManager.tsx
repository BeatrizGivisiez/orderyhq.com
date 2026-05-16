import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Product, Category } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, X, ShoppingBag, Tag, LayoutList, LayoutGrid } from 'lucide-react';

export const MenuManager: React.FC = () => {
  const { tenant } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [promotionalPrice, setPromotionalPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant?.id) return;

    const unsubProducts = onSnapshot(
      query(collection(db, `tenants/${tenant.id}/products`)),
      (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        setLoading(false);
      }
    );

    const unsubCategories = onSnapshot(
      query(collection(db, `tenants/${tenant.id}/categories`)),
      (snap) => {
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      }
    );

    return () => { unsubProducts(); unsubCategories(); };
  }, [tenant?.id]);

  const openForm = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setImageUrl(product.imageUrl || '');
      setPromotionalPrice(product.promotionalPrice ? product.promotionalPrice.toString() : '');
      setCategoryId(product.categoryId || '');
    } else {
      setEditingId(null);
      setName('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setPromotionalPrice('');
      setCategoryId(categories[0]?.id || '');
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleAddCategory = async () => {
    if (!tenant?.id || !newCategoryName.trim()) return;
    try {
      const ref = await addDoc(collection(db, `tenants/${tenant.id}/categories`), {
        name: newCategoryName.trim(),
        order: categories.length,
      });
      setCategoryId(ref.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
      toast.success('Categoria criada');
    } catch {
      toast.error('Erro ao criar categoria');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!tenant?.id) return;
    if (!window.confirm('Excluir categoria? Os produtos dela ficam sem categoria.')) return;
    await deleteDoc(doc(db, `tenants/${tenant.id}/categories`, catId));
    if (categoryId === catId) setCategoryId('');
    toast.success('Categoria excluída');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id) return;
    setIsSaving(true);

    try {
      const parsedPrice = parseFloat(price.replace(',', '.'));
      if (isNaN(parsedPrice) || parsedPrice < 0) throw new Error('Preço inválido');

      const parsedPromo = promotionalPrice ? parseFloat(promotionalPrice.replace(',', '.')) : undefined;
      if (parsedPromo !== undefined && (isNaN(parsedPromo) || parsedPromo <= 0 || parsedPromo >= parsedPrice)) {
        throw new Error('Preço promocional deve ser menor que o preço original e maior que zero.');
      }

      const productData: Omit<Product, 'id'> = {
        name,
        description,
        price: parsedPrice,
        promotionalPrice: parsedPromo ?? 0,
        imageUrl: imageUrl.trim() || '',
        categoryId: categoryId || 'geral',
        active: true,
      };

      if (editingId) {
        await setDoc(doc(db, `tenants/${tenant.id}/products`, editingId), productData, { merge: true });
        toast.success('Produto atualizado');
      } else {
        const newRef = doc(collection(db, `tenants/${tenant.id}/products`));
        await setDoc(newRef, { ...productData, id: newRef.id });
        toast.success('Produto criado');
      }
      closeForm();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!tenant?.id) return;
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    try {
      await deleteDoc(doc(db, `tenants/${tenant.id}/products`, id));
      toast.success('Produto excluído');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const getCategoryName = (catId: string) =>
    categories.find(c => c.id === catId)?.name ?? (catId === 'geral' ? 'Geral' : '—');

  const visibleProducts = filterCategoryId
    ? products.filter(p => p.categoryId === filterCategoryId)
    : products;

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="h-4 bg-slate-200 rounded w-1/4"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Meu Cardápio</h1>
        <div className="flex items-center gap-2">
          {/* Toggle lista/card */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em lista"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => openForm()} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        </div>
      </div>

      {/* Filtro por categoria */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategoryId(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterCategoryId === null ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            Todos ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterCategoryId === cat.id ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {cat.name} ({products.filter(p => p.categoryId === cat.id).length})
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {visibleProducts.length === 0 ? (
              <li className="p-8 text-center text-slate-500 text-sm font-medium">
                {filterCategoryId ? 'Nenhum produto nesta categoria.' : 'Nenhum produto cadastrado.'}
              </li>
            ) : (
              visibleProducts.map((product) => (
                <li key={product.id} className="p-4 hover:bg-slate-50 flex items-center gap-4 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      : <ShoppingBag className="h-5 w-5 text-slate-300" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900">{product.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{product.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {product.promotionalPrice ? (
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-orange-500">{formatCurrency(product.promotionalPrice)}</p>
                          <p className="text-xs text-slate-400 line-through">{formatCurrency(product.price)}</p>
                          <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                            -{Math.round((1 - product.promotionalPrice / product.price) * 100)}%
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-orange-500">{formatCurrency(product.price)}</p>
                      )}
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                        {getCategoryName(product.categoryId)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 shrink-0">
                    <button onClick={() => openForm(product)} className="p-2 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Grid */}
      {viewMode === 'grid' && (
        <div>
          {visibleProducts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500 text-sm font-medium">
              {filterCategoryId ? 'Nenhum produto nesta categoria.' : 'Nenhum produto cadastrado.'}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {visibleProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-orange-200 transition-all flex flex-col">
                  <div className="w-full aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      : <ShoppingBag className="h-6 w-6 text-slate-300" />
                    }
                  </div>
                  <div className="p-2 flex flex-col flex-1">
                    <h3 className="text-xs font-bold text-slate-900 leading-tight line-clamp-1">{product.name}</h3>
                    <p className="text-orange-500 font-bold text-xs mt-1">{formatCurrency(product.price)}</p>
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex gap-1">
                      <button onClick={() => openForm(product)} className="flex-1 py-0.5 text-slate-400 hover:text-orange-600 rounded hover:bg-orange-50 transition-colors flex items-center justify-center">
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="flex-1 py-0.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors flex items-center justify-center">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-bold text-slate-900">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              <Input
                label="Nome do Produto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: X-Burguer Especial"
              />

              <Input
                label="Preço Original"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="25.90"
              />
              <div>
                <Input
                  label="Preço Promocional (opcional)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={promotionalPrice}
                  onChange={(e) => setPromotionalPrice(e.target.value)}
                  placeholder="19.90"
                />
                {promotionalPrice && price && parseFloat(promotionalPrice) > 0 && parseFloat(promotionalPrice) < parseFloat(price) && (
                  <p className="text-xs text-green-600 font-bold mt-1">
                    Desconto de {Math.round((1 - parseFloat(promotionalPrice) / parseFloat(price)) * 100)}% aplicado
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  className="flex w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ingredientes, detalhes..."
                />
              </div>

              <Input
                label="URL da Imagem (Opcional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-slate-200" onError={(e) => (e.currentTarget.style.display = 'none')} />
              )}

              {/* Categoria */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                {categories.length === 0 ? (
                  <p className="text-xs text-slate-400 mb-2">Nenhuma categoria criada ainda.</p>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                )}

                {/* Gerenciar categorias */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {categories.map(cat => (
                    <span key={cat.id} className="flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-full">
                      <Tag className="h-3 w-3" />
                      {cat.name}
                      <button type="button" onClick={() => handleDeleteCategory(cat.id)} className="text-slate-400 hover:text-red-500 ml-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {isAddingCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nome da categoria"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                      autoFocus
                    />
                    <Button type="button" size="sm" onClick={handleAddCategory}>Criar</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsAddingCategory(false)}>Cancelar</Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Nova categoria
                  </button>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={closeForm}>Cancelar</Button>
                <Button type="submit" isLoading={isSaving}>Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
