
import { DepartmentData } from './types';

export const DEPARTMENTS: string[] = [
  "Hortifruti",
  "Açougue",
  "Padaria",
  "Laticínios",
  "Mercearia",
  "Bebidas",
  "Limpeza",
  "Higiene pessoal",
  "Congelados",
  "Pet",
  "Outros"
];

export const PRODUCTS: DepartmentData = {
  "Hortifruti": ["Arroz", "Batata", "Cebola", "Alho", "Tomate", "Cenoura", "Banana", "Maçã", "Laranja", "Limão", "Mamão", "Alface", "Couve", "Brócolis", "Abobrinha", "Pepino", "Pimentão", "Ovos"],
  "Açougue": ["Carne bovina", "Frango", "Peito de frango", "Coxa/sobrecoxa", "Carne moída", "Linguiça", "Costela", "Porco", "Peixe", "Filé de peixe", "Bacon"],
  "Padaria": ["Pão francês", "Pão de forma", "Pão integral", "Bolo", "Rosca", "Pão doce", "Torrada"],
  "Laticínios": ["Leite", "Leite integral", "Leite desnatado", "Iogurte", "Iogurte natural", "Requeijão", "Queijo", "Mussarela", "Presunto", "Manteiga", "Margarina", "Creme de leite"],
  "Mercearia": ["Arroz", "Feijão", "Açúcar", "Sal", "Café", "Óleo", "Azeite", "Macarrão", "Molho de tomate", "Farinha de trigo", "Farinha de mandioca", "Milho", "Achocolatado", "Biscoito", "Bolacha", "Cereal"],
  "Bebidas": ["Água", "Água com gás", "Refrigerante", "Suco", "Cerveja", "Vinho", "Energético"],
  "Limpeza": ["Detergente", "Sabão em pó", "Sabão líquido", "Amaciante", "Água sanitária", "Desinfetante", "Limpador multiuso", "Esponja", "Saco de lixo", "Papel toalha"],
  "Higiene pessoal": ["Papel higiênico", "Shampoo", "Condicionador", "Sabonete", "Creme dental", "Escova de dentes", "Desodorante", "Absorvente", "Lenço umedecido"],
  "Congelados": ["Pizza congelada", "Lasanha", "Nuggets", "Hambúrguer", "Batata congelada", "Sorvete"],
  "Pet": ["Ração", "Areia para gato", "Petisco", "Shampoo pet"],
  "Outros": []
};
