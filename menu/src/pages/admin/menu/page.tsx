import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { Product, Category } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { formatCurrency } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, X, ShoppingBag, Tag, LayoutList, LayoutGrid } from 'lucide-react';

export const MenuManager: React.FC = () => {
  const { tenant } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return (
    <div className="animate-pulse flex space-x-4">
      <div className="h-4 bg-elevated rounded w-1/4"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-content">Meu Cardápio</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-elevated rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-surface text-content shadow-sm' : 'text-faint hover:text-muted'}`}
              title="Visualização em lista"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-surface text-content shadow-sm' : 'text-faint hover:text-muted'}`}
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterCategoryId === null ? 'bg-accent text-accent-ink' : 'bg-elevated text-faint hover:bg-surface-2 hover:text-muted'}`}
          >
            Todos ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterCategoryId === cat.id ? 'bg-accent text-accent-ink' : 'bg-elevated text-faint hover:bg-surface-2 hover:text-muted'}`}
            >
              {cat.name} ({products.filter(p => p.categoryId === cat.id).length})
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {viewMode === 'list' && (
        <div className="bg-surface rounded-xl border border-line overflow-hidden">
          <ul className="divide-y divide-line">
            {visibleProducts.length === 0 ? (
              <li className="p-8 text-center text-faint text-sm font-medium">
                {filterCategoryId ? 'Nenhum produto nesta categoria.' : 'Nenhum produto cadastrado.'}
              </li>
            ) : (
              visibleProducts.map((product) => (
                <li key={product.id} className="p-4 hover:bg-elevated flex items-center gap-4 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-elevated flex items-center justify-center shrink-0 overflow-hidden">
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      : <ShoppingBag className="h-5 w-5 text-faint" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-content">{product.name}</h3>
                    <p className="text-xs text-faint line-clamp-1 mt-0.5">{product.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {product.promotionalPrice ? (
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-accent">{formatCurrency(product.promotionalPrice)}</p>
                          <p className="text-xs text-faint line-through">{formatCurrency(product.price)}</p>
                          <span className="text-[9px] bg-warn/15 text-warn font-bold px-1.5 py-0.5 rounded-full">
                            -{Math.round((1 - product.promotionalPrice / product.price) * 100)}%
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-accent">{formatCurrency(product.price)}</p>
                      )}
                      <span className="text-[10px] bg-elevated text-faint font-bold px-2 py-0.5 rounded-full border border-line">
                        {getCategoryName(product.categoryId)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 shrink-0">
                    <button onClick={() => openForm(product)} className="p-2 text-faint hover:text-accent rounded-lg hover:bg-accent/8 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-faint hover:text-warn rounded-lg hover:bg-warn/8 transition-colors">
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
            <div className="bg-surface rounded-xl border border-line p-8 text-center text-faint text-sm font-medium">
              {filterCategoryId ? 'Nenhum produto nesta categoria.' : 'Nenhum produto cadastrado.'}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {visibleProducts.map((product) => (
                <div key={product.id} className="bg-surface rounded-xl border border-line overflow-hidden hover:border-accent/30 transition-all flex flex-col">
                  <div className="w-full aspect-square bg-elevated flex items-center justify-center overflow-hidden">
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      : <ShoppingBag className="h-6 w-6 text-faint" />
                    }
                  </div>
                  <div className="p-2 flex flex-col flex-1">
                    <h3 className="text-xs font-bold text-content leading-tight line-clamp-1">{product.name}</h3>
                    <p className="text-accent font-bold text-xs mt-1">{formatCurrency(product.price)}</p>
                    <div className="mt-1.5 pt-1.5 border-t border-line flex gap-1">
                      <button onClick={() => openForm(product)} className="flex-1 py-0.5 text-faint hover:text-accent rounded hover:bg-accent/8 transition-colors flex items-center justify-center">
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="flex-1 py-0.5 text-faint hover:text-warn rounded hover:bg-warn/8 transition-colors flex items-center justify-center">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border border-line rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-line shrink-0">
              <h3 className="text-lg font-bold text-content">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={closeForm} className="text-faint hover:text-muted rounded-full p-1 hover:bg-elevated transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              <Input label="Nome do Produto" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: X-Burguer Especial" />

              <Input label="Preço Original" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="25.90" />

              <div>
                <Input label="Preço Promocional (opcional)" type="number" step="0.01" min="0" value={promotionalPrice} onChange={(e) => setPromotionalPrice(e.target.value)} placeholder="19.90" />
                {promotionalPrice && price && parseFloat(promotionalPrice) > 0 && parseFloat(promotionalPrice) < parseFloat(price) && (
                  <p className="text-xs text-accent font-bold mt-1">
                    Desconto de {Math.round((1 - parseFloat(promotionalPrice) / parseFloat(price)) * 100)}% aplicado
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-muted mb-1">Descrição</label>
                <textarea
                  className="flex w-full rounded-xl border border-line-2 bg-surface-2 hover:bg-elevated transition-colors px-4 py-2 text-sm text-content placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent focus:bg-elevated"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ingredientes, detalhes..."
                />
              </div>

              <Input label="URL da Imagem (Opcional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" />
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-line" onError={(e) => (e.currentTarget.style.display = 'none')} />
              )}

              <div>
                <label className="block text-sm font-bold text-muted mb-1">Categoria</label>
                {categories.length === 0 ? (
                  <p className="text-xs text-faint mb-2">Nenhuma categoria criada ainda.</p>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className="flex w-full rounded-xl border border-line-2 bg-surface-2 px-4 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-accent mb-2"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                )}

                <div className="flex flex-wrap gap-2 mb-2">
                  {categories.map(cat => (
                    <span key={cat.id} className="flex items-center gap-1 text-[11px] bg-elevated text-muted font-bold px-2 py-1 rounded-full border border-line">
                      <Tag className="h-3 w-3" />
                      {cat.name}
                      <button type="button" onClick={() => handleDeleteCategory(cat.id)} className="text-faint hover:text-warn ml-0.5">
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
                      className="flex-1 rounded-xl border border-line-2 bg-surface-2 px-3 py-1.5 text-sm text-content placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent"
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
                    className="text-xs font-bold text-accent hover:text-accent-2 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Nova categoria
                  </button>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-line">
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
