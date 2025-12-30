
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ShoppingBag, Plus, Trash2, ArrowLeft, X, Pencil, Minus } from 'lucide-react';
import { BagItem, ViewState } from './types';
import { DEPARTMENTS, PRODUCTS } from './constants';

const WEIGHT_KEYWORDS = [
  'alho','cebola','tomate','banana','maçã','laranja','limão','mamão','alface','couve','brócolis','abobrinha','pepino','pimentão',
  'batata','abacate','abacaxi','melão','melancia','uva','manga','pera','pêssego','cenoura','beterraba','morango','goiaba'
];

export default function App() {
  const [bag, setBag] = useState<BagItem[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('departments');
  const [selectedDept, setSelectedDept] = useState<string>(DEPARTMENTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{name: string, dept: string} | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [quantityInput, setQuantityInput] = useState(1);
  const [weightInput, setWeightInput] = useState(0);
  const [isWeightMode, setIsWeightMode] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [isCondensed, setIsCondensed] = useState(false);
  const mainRef = useRef<HTMLDivElement | null>(null);

  const getItemTotal = (item: BagItem) => {
    if (item.pricingType === 'weight') {
      const grams = item.weightGrams ?? 0;
      return item.unitPrice * (grams / 1000) * (item.quantity ?? 1);
    }
    return item.unitPrice * item.quantity;
  };

  const shouldUseWeightPricing = (name: string, dept: string) => {
    if (dept !== 'Hortifruti') return false;
    const normalized = name.toLowerCase();
    return WEIGHT_KEYWORDS.some(keyword => normalized.includes(keyword));
  };

  // Local Storage persistence
  useEffect(() => {
    const savedBag = localStorage.getItem('qv_bag');
    const hintSeen = localStorage.getItem('qv_hint_dismissed');
    setShowHint(!hintSeen);

    if (savedBag) {
      try {
        const parsed = JSON.parse(savedBag);
        const normalized: BagItem[] = Array.isArray(parsed) ? parsed.map((item: any) => ({
          id: item.id ?? crypto.randomUUID(),
          name: item.name ?? 'Item',
          department: item.department ?? 'Outros',
          unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : (typeof item.price === 'number' ? item.price : 0),
          quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
          pricingType: item.pricingType === 'weight' ? 'weight' : 'unit',
          weightGrams: item.pricingType === 'weight' ? (item.weightGrams ?? 0) : undefined,
          timestamp: item.timestamp ?? Date.now()
        })).filter((item: BagItem) => item.unitPrice >= 0) : [];
        setBag(normalized);
      } catch (e) {
        console.error("Error loading bag", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('qv_bag', JSON.stringify(bag));
  }, [bag]);

  const total = useMemo(() => {
    return bag.reduce((acc, item) => acc + getItemTotal(item), 0);
  }, [bag]);

  useEffect(() => {
    const node = mainRef.current;
    if (!node) return;
    const onScroll = () => setIsCondensed(node.scrollTop > 32);
    node.addEventListener('scroll', onScroll);
    return () => node.removeEventListener('scroll', onScroll);
  }, []);

  const filteredProducts = useMemo(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const all: {name: string, dept: string}[] = [];
      Object.entries(PRODUCTS).forEach(([dept, items]) => {
        items.forEach(item => {
          if (item.toLowerCase().includes(query)) {
            all.push({ name: item, dept });
          }
        });
      });
      return all;
    }
    return PRODUCTS[selectedDept].map(name => ({ name, dept: selectedDept }));
  }, [searchQuery, selectedDept]);

  const parsedPriceInput = parseFloat(priceInput.replace(',', '.'));
  const basePrice = !isNaN(parsedPriceInput) ? parsedPriceInput : 0;
  const modalSubtotal = isWeightMode 
    ? basePrice * (weightInput / 1000) * quantityInput
    : basePrice * quantityInput;

  const groupedBag = useMemo(() => {
    const groups: Record<string, BagItem[]> = {};
    const deptOrder = new Map(DEPARTMENTS.map((dept, idx) => [dept, idx]));

    bag.forEach(item => {
      if (!groups[item.department]) groups[item.department] = [];
      groups[item.department].push(item);
    });

    const orderedDepts = Object.keys(groups).sort((a, b) => {
      const aOrder = deptOrder.get(a) ?? 999;
      const bOrder = deptOrder.get(b) ?? 999;
      if (aOrder === bOrder) return a.localeCompare(b);
      return aOrder - bOrder;
    });

    return orderedDepts.map(dept => ({
      dept,
      items: groups[dept].sort((a, b) => b.timestamp - a.timestamp),
      subtotal: groups[dept].reduce((acc, item) => acc + getItemTotal(item), 0)
    }));
  }, [bag]);

  const handleAddProduct = (name: string, dept: string) => {
    setModalMode('add');
    setSelectedItemId(null);
    setSelectedProduct({ name, dept });
    setPriceInput('');
    setQuantityInput(1);
    const weightBased = shouldUseWeightPricing(name, dept);
    setIsWeightMode(weightBased);
    setWeightInput(weightBased ? 500 : 0);
    setIsPriceModalOpen(true);
  };

  const handleEditItem = (item: BagItem) => {
    setModalMode('edit');
    setSelectedItemId(item.id);
    setSelectedProduct({ name: item.name, dept: item.department });
    setPriceInput(String(item.unitPrice));
    setQuantityInput(item.quantity);
    setIsWeightMode(item.pricingType === 'weight');
    setWeightInput(item.pricingType === 'weight' ? (item.weightGrams ?? 0) : 0);
    setIsPriceModalOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setBag(prev => prev.map(item => {
      if (item.id !== id) return item;
      const nextQuantity = Math.max(1, item.quantity + delta);
      return { ...item, quantity: nextQuantity, timestamp: Date.now() };
    }));
  };

  const closeModal = () => {
    setIsPriceModalOpen(false);
    setSelectedProduct(null);
    setSelectedItemId(null);
    setPriceInput('');
    setQuantityInput(1);
    setWeightInput(0);
    setIsWeightMode(false);
  };

  const confirmPrice = () => {
    if (!selectedProduct) return;
    const price = parseFloat(priceInput.replace(',', '.'));
    const hasValidWeight = !isWeightMode || weightInput > 0;
    if (isNaN(price) || price <= 0 || quantityInput <= 0 || !hasValidWeight) return;

    if (modalMode === 'edit' && selectedItemId) {
      setBag(prev => prev.map(item => item.id === selectedItemId 
        ? { 
            ...item, 
            unitPrice: price, 
            quantity: quantityInput, 
            pricingType: isWeightMode ? 'weight' : 'unit',
            weightGrams: isWeightMode ? weightInput : undefined,
            timestamp: Date.now() 
          }
        : item
      ));
    } else {
      const newItem: BagItem = {
        id: crypto.randomUUID(),
        name: selectedProduct.name,
        department: selectedProduct.dept,
        unitPrice: price,
        quantity: quantityInput,
        pricingType: isWeightMode ? 'weight' : 'unit',
        weightGrams: isWeightMode ? weightInput : undefined,
        timestamp: Date.now()
      };
      setBag(prev => [newItem, ...prev]);
    }

    setSearchQuery('');
    closeModal();
  };

  const removeItem = (id: string) => {
    setBag(prev => prev.filter(item => item.id !== id));
  };

  const clearBag = () => {
    if (window.confirm('Deseja limpar toda a sacola?')) {
      setBag([]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto shadow-xl bg-white">
      {/* Fixed Header */}
      <header className={`sticky top-0 z-40 bg-indigo-600 text-white shadow-md pt-safe transition-all duration-200 ${isCondensed ? 'p-3' : 'p-4'}`}>
        <div className="flex justify-between items-center mb-2">
          <h1 className={`font-bold tracking-tight ${isCondensed ? 'text-lg' : 'text-xl'}`}>Quanto Vai Dar?</h1>
          <button 
            onClick={() => setCurrentView(currentView === 'bag' ? 'departments' : 'bag')}
            className="relative p-2"
          >
            <ShoppingBag size={24} />
            {bag.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-indigo-600">
                {bag.length}
              </span>
            )}
          </button>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-indigo-100 text-sm font-semibold uppercase tracking-wider">Total Estimado</span>
          <span className={`${isCondensed ? 'text-2xl' : 'text-3xl'} font-black`}>
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-32">
        {currentView === 'departments' ? (
          <div className="animate-in fade-in duration-300">
            {/* Search */}
            <div className="p-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-100 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {showHint && (
              <div className="px-4 pb-2">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3">
                  <div className="flex-1 text-sm text-indigo-900">
                    <p className="font-bold mb-2">Como funciona</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-indigo-800">
                      <li>Busque ou escolha um departamento.</li>
                      <li>Toque em um item e informe o preço estimado.</li>
                      <li>Na sacola, ajuste quantidade ou edite o preço.</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => { setShowHint(false); localStorage.setItem('qv_hint_dismissed', '1'); }}
                    className="self-start text-indigo-300 hover:text-indigo-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Department Selector (Only if not searching) */}
            {!searchQuery && (
              <div className="flex overflow-x-auto no-scrollbar gap-2 px-4 pb-4 border-b border-slate-100">
                {DEPARTMENTS.map(dept => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                      selectedDept === dept 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                      : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            )}

            {/* Product Suggestions */}
            <div className="p-4 grid grid-cols-1 gap-3">
              <h2 className="text-slate-500 text-xs font-bold uppercase mb-1 tracking-widest px-1">
                {searchQuery ? 'Resultados da busca' : `Sugestões em ${selectedDept}`}
              </h2>
              {filteredProducts.map((prod, idx) => (
                <button
                  key={`${prod.name}-${idx}`}
                  onClick={() => handleAddProduct(prod.name, prod.dept)}
                  className="flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-2xl active:scale-95 transition-transform text-left group hover:border-indigo-200"
                >
                  <span className="text-lg font-semibold text-slate-700">{prod.name}</span>
                  <Plus className="text-indigo-500 group-hover:scale-110 transition-transform" size={24} />
                </button>
              ))}
              
              {/* Custom Entry */}
              {searchQuery && filteredProducts.length === 0 && (
                <button
                  onClick={() => handleAddProduct(searchQuery, 'Outros')}
                  className="flex items-center justify-center gap-2 p-5 bg-indigo-50 border-2 border-indigo-200 rounded-2xl text-indigo-700 font-bold active:scale-95 transition-transform"
                >
                  <Plus size={24} />
                  <span>Adicionar "{searchQuery}"</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-300 p-4">
            <div className="flex items-center gap-2 mb-6">
              <button 
                onClick={() => setCurrentView('departments')}
                className="p-2 -ml-2 text-slate-400 active:text-indigo-600"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-black text-slate-800">Sua Sacola</h2>
            </div>

            {bag.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <ShoppingBag size={80} className="mb-4 opacity-20" />
                <p className="text-lg font-bold text-slate-500">Sacola vazia</p>
                <p className="text-sm text-slate-400 text-center mt-1 px-6">Busque ou escolha um departamento, adicione preços e acompanhe o total aqui.</p>
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => setCurrentView('departments')}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl"
                  >
                    Começar
                  </button>
                  <button 
                    onClick={() => { setShowHint(true); localStorage.removeItem('qv_hint_dismissed'); }}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-100"
                  >
                    Ver dicas
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Spend breakdown */}
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Onde você está gastando</h3>
                    <span className="text-[11px] text-indigo-700 font-semibold">Total {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="space-y-2">
                    {groupedBag.map(group => {
                      const percent = total > 0 ? Math.round((group.subtotal / total) * 100) : 0;
                      return (
                        <div key={`chart-${group.dept}`}>
                          <div className="flex justify-between text-[12px] font-semibold text-indigo-900 mb-1">
                            <span>{group.dept}</span>
                            <span>{group.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · {percent}%</span>
                          </div>
                          <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-indigo-100">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full transition-all" 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {groupedBag[0] && (
                    <p className="text-[11px] text-indigo-800 mt-3">
                      Dica: tente reduzir {groupedBag[0].dept} em 10% para baixar o total.
                    </p>
                  )}
                </div>

                {groupedBag.map(group => (
                  <div key={group.dept} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest">{group.dept}</div>
                      <div className="text-sm font-black text-slate-600">
                        {group.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {group.items.map(item => (
                        <div 
                          key={item.id} 
                          className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                              {item.pricingType === 'weight' ? (
                                <p className="text-xs text-slate-400 font-semibold uppercase">
                                  R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg · {(item.weightGrams ?? 0).toLocaleString('pt-BR')} g
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400 font-semibold uppercase">
                                  R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por unidade
                                </p>
                              )}
                            </div>
                            <button 
                              onClick={() => handleEditItem(item)}
                              className="p-2 text-slate-300 hover:text-indigo-600"
                            >
                              <Pencil size={18} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-4 gap-4">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                              <button 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-2 text-slate-500 hover:text-indigo-600"
                                aria-label="Diminuir quantidade"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="min-w-[28px] text-center font-bold text-slate-800">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-2 text-indigo-600 hover:text-indigo-800"
                                aria-label="Aumentar quantidade"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-xs text-slate-500 text-right">
                                <div>Subtotal</div>
                                <div className="font-bold text-lg text-slate-900">
                                  {(item.unitPrice * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                              </div>
                              <button 
                                onClick={() => removeItem(item.id)}
                                className="p-2 text-red-100 bg-red-50 rounded-xl active:bg-red-500 active:text-white transition-colors"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={clearBag}
                  className="w-full flex items-center justify-center gap-2 py-4 mt-2 text-red-500 font-bold border-2 border-dashed border-red-200 rounded-2xl active:bg-red-50"
                >
                  <Trash2 size={18} />
                  Limpar sacola
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Price Input Modal */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 mb-safe animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800">{selectedProduct?.name}</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">{selectedProduct?.dept}</p>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-300">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button 
                onClick={() => { setIsWeightMode(false); setWeightInput(0); }}
                className={`py-3 rounded-2xl font-bold text-sm border ${!isWeightMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
              >
                Preço por unidade
              </button>
              <button 
                onClick={() => { setIsWeightMode(true); setWeightInput(weightInput || 500); }}
                className={`py-3 rounded-2xl font-bold text-sm border ${isWeightMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
              >
                Preço por kg
              </button>
            </div>

            <label className="block text-slate-500 text-xs font-bold uppercase mb-2">
              {isWeightMode ? 'Preço por kg' : 'Qual o preço estimado?'}
            </label>
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">R$</span>
              <input 
                type="number" 
                step="0.01"
                inputMode="decimal"
                autoFocus
                placeholder="0,00"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmPrice()}
                className="w-full pl-16 pr-4 py-6 bg-slate-100 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 text-4xl font-black text-slate-900 transition-all placeholder:text-slate-200"
              />
            </div>

            {isWeightMode && (
              <div className="mb-4">
                <label className="block text-slate-500 text-xs font-bold uppercase mb-2">Peso total (gramas)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    min="1"
                    step="50"
                    value={weightInput}
                    onChange={(e) => setWeightInput(Number(e.target.value))}
                    className="w-full px-4 py-4 bg-slate-100 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 text-2xl font-black text-slate-900 transition-all placeholder:text-slate-200"
                    placeholder="ex: 800"
                  />
                  <span className="text-sm font-semibold text-slate-400 uppercase">g</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                <button 
                  onClick={() => setQuantityInput(Math.max(1, quantityInput - 1))}
                  className="p-2 text-slate-500 hover:text-indigo-600"
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-[28px] text-center font-bold text-slate-800">{quantityInput}</span>
                <button 
                  onClick={() => setQuantityInput(quantityInput + 1)}
                  className="p-2 text-indigo-600 hover:text-indigo-800"
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase font-semibold">Total deste item</p>
                <p className="text-2xl font-black text-slate-900">
                  {modalSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={closeModal}
                className="py-5 bg-slate-100 text-slate-500 rounded-2xl font-bold text-lg active:scale-95 transition-transform"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmPrice}
                disabled={!priceInput || isNaN(parsedPriceInput) || parsedPriceInput <= 0 || quantityInput <= 0}
                className="py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
              >
                {modalMode === 'edit' ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monetization Banner Area */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-50 border-t border-slate-200 px-4 py-2 z-40 pb-safe">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Área publicitária</span>
          <button 
            onClick={() => setShowBanner(prev => !prev)}
            className="text-xs font-semibold text-indigo-600"
          >
            {showBanner ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {showBanner ? (
          <div className="w-full h-14 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 font-bold text-xs uppercase tracking-widest border border-slate-300 overflow-hidden">
            <div className="flex flex-col items-center">
              <span>Reservado para anúncios ou CTA de parceiros</span>
              <span className="text-[8px] opacity-60">Clique para negociar espaço</span>
            </div>
          </div>
        ) : (
          <div className="w-full bg-white border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 py-3">
            Banner oculto para liberar área útil
          </div>
        )}
      </footer>
    </div>
  );
}
