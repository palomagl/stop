import { chaveResposta, normalizar } from '@rabisco/shared';
import { limparOpcoes, type Cerebro, type RespostaParaJulgar, type SituacaoCerebro } from './cerebro';

/**
 * As palavras que o robô conhece sem IA. Em cada letra, a ordem vai da mais comum (a que
 * quase todo mundo escreve) para a mais rara. Para ensinar uma palavra nova, é só colocar
 * na lista: ela entra sozinha na letra certa.
 */
interface Lista {
  porLetra: Map<string, string[]>;
  chaves: Set<string>;
}

function lista(...textos: string[]): Lista {
  const porLetra = new Map<string, string[]>();
  const chaves = new Set<string>();
  for (const texto of textos) {
    for (const palavra of texto.split(',').map((p) => p.trim()).filter(Boolean)) {
      const chave = chaveResposta(palavra);
      if (chaves.has(chave)) continue;
      chaves.add(chave);
      const letra = normalizar(palavra)[0]!.toUpperCase();
      porLetra.set(letra, [...(porLetra.get(letra) ?? []), palavra]);
    }
  }
  return { porLetra, chaves };
}

const TEXTO = {
  nomes: `Ana, Amanda, André, Antônio, Alice, Arthur, Aline, Alexandre,
    Bruno, Beatriz, Bianca, Bernardo, Bárbara, Breno,
    Carlos, Camila, Carla, Caio, Cláudia, Cecília,
    Daniel, Diego, Débora, Diana, Davi, Denise,
    Eduardo, Eduarda, Elisa, Emanuel, Érica, Enzo,
    Fernanda, Felipe, Fábio, Flávia, Francisco, Fátima,
    Gabriel, Gabriela, Gustavo, Giovana, Guilherme, Gisele,
    Helena, Henrique, Heitor, Hugo, Heloísa, Hélio,
    Isabela, Igor, Isadora, Ícaro, Ingrid, Ivan,
    João, Júlia, José, Juliana, Jorge, Jéssica,
    Kátia, Karina, Kevin, Kaique,
    Lucas, Laura, Larissa, Leonardo, Luana, Lívia,
    Maria, Mateus, Mariana, Marcos, Manuela, Miguel,
    Natália, Nicolas, Nina, Nathan, Nádia, Norberto,
    Otávio, Olívia, Oscar, Orlando, Odete,
    Pedro, Paula, Patrícia, Paulo, Priscila, Pietro,
    Quitéria, Quintino,
    Rafael, Rafaela, Rodrigo, Renata, Ricardo, Rebeca,
    Sofia, Samuel, Sara, Sérgio, Sílvia, Sabrina,
    Tiago, Talita, Tatiana, Tomás, Teresa, Túlio,
    Ulisses, Úrsula, Ubirajara, Umberto,
    Vitória, Vinícius, Vanessa, Valéria, Vitor, Valentina,
    Wagner, Wesley, Wanessa, Washington,
    Xavier, Ximena,
    Yasmin, Yuri, Yara,
    Zeca, Zélia, Zuleica, Zacarias`,

  animais: `Abelha, Arara, Anta, Avestruz, Águia, Aranha, Antílope, Alpaca,
    Baleia, Boi, Burro, Borboleta, Búfalo, Besouro, Bode,
    Cachorro, Cavalo, Coelho, Cobra, Camelo, Canguru, Coruja, Capivara,
    Dromedário, Dálmata, Doninha, Dourado, Dingo,
    Elefante, Ema, Esquilo, Enguia, Escorpião, Estrela-do-mar,
    Formiga, Foca, Flamingo, Furão, Falcão, Faisão,
    Gato, Girafa, Galinha, Gorila, Gaivota, Guaxinim, Gafanhoto,
    Hipopótamo, Hiena, Hamster, Harpia,
    Iguana, Impala, Irara, Inhambu, Íbis,
    Jacaré, Jabuti, Javali, Jaguatirica, Joaninha, Jumento, Jiboia,
    Kiwi, Krill,
    Leão, Lobo, Lagarto, Lhama, Leopardo, Lontra, Lagosta,
    Macaco, Morcego, Minhoca, Mosquito, Mico, Marreco, Mula,
    Naja, Narval, Nandu, Novilho,
    Onça, Ovelha, Orca, Ornitorrinco, Ostra, Orangotango,
    Pato, Porco, Peixe, Pinguim, Papagaio, Pavão, Preguiça, Panda,
    Quati, Quero-quero,
    Rato, Rinoceronte, Raposa, Rã, Rena, Rouxinol,
    Sapo, Sabiá, Siri, Suricato, Serpente, Sardinha, Salmão,
    Tatu, Tigre, Tucano, Tartaruga, Tubarão, Tamanduá, Touro,
    Urso, Urubu, Urutau, Uirapuru,
    Vaca, Veado, Vespa, Vaga-lume, Víbora,
    Xexéu, Xaréu,
    Yorkshire,
    Zebra, Zangão, Zebu, Zorrilho`,

  cores: `Azul, Amarelo, Abóbora, Anil, Areia, Âmbar,
    Branco, Bege, Bordô, Bronze,
    Cinza, Caramelo, Coral, Creme, Ciano, Cobre, Champanhe,
    Dourado,
    Esmeralda, Escarlate,
    Fúcsia, Ferrugem, Framboesa,
    Grafite, Goiaba, Gelo, Grená,
    Hortelã,
    Índigo,
    Jade, Jambo,
    Laranja, Lilás, Lavanda,
    Marrom, Magenta, Mostarda, Marfim, Musgo,
    Nude, Nanquim,
    Ocre, Oliva, Ouro,
    Preto, Prata, Pérola, Pêssego, Púrpura,
    Rosa, Roxo, Rubi, Rosé,
    Salmão, Sépia, Safira,
    Turquesa, Terracota, Tijolo,
    Uva,
    Verde, Vermelho, Vinho, Violeta`,

  frutas: `Abacaxi, Abacate, Acerola, Amora, Ameixa, Açaí, Atemoia,
    Banana, Bacuri, Bergamota, Buriti, Biribá,
    Caju, Cereja, Coco, Carambola, Cupuaçu, Cajá,
    Damasco, Dendê,
    Figo, Framboesa, Fruta-do-conde, Fisális,
    Goiaba, Graviola, Groselha, Guaraná, Gabiroba,
    Ingá,
    Jabuticaba, Jaca, Jambo, Jenipapo, Jurubeba,
    Kiwi, Kinkan,
    Laranja, Limão, Lichia, Lima,
    Manga, Maçã, Melancia, Melão, Mamão, Maracujá, Mexerica, Morango,
    Nectarina, Nêspera,
    Oiti,
    Pera, Pêssego, Pitanga, Pitaya, Pinha, Pequi,
    Romã, Rambutã,
    Sapoti, Siriguela,
    Tangerina, Tâmara, Tamarindo,
    Uva, Umbu, Uvaia`,

  legumes: `Alface, Abobrinha, Abóbora, Agrião, Alho, Aipim, Acelga, Aspargo,
    Batata, Beterraba, Brócolis, Berinjela, Batata-doce,
    Cenoura, Couve, Cebola, Chuchu, Couve-flor, Coentro,
    Ervilha, Espinafre, Escarola, Endívia,
    Gengibre, Grão-de-bico,
    Inhame,
    Jiló,
    Lentilha,
    Mandioca, Milho, Maxixe, Mostarda,
    Nabo,
    Pepino, Pimentão, Palmito, Pimenta,
    Quiabo,
    Rabanete, Repolho, Rúcula,
    Salsinha, Salsão,
    Tomate, Taioba,
    Vagem`,

  objetos: `Agulha, Abajur, Apito, Anel, Armário, Alicate, Apontador,
    Bola, Balde, Bolsa, Borracha, Banco, Bule, Boné,
    Cadeira, Caneta, Copo, Cama, Celular, Chave, Colher, Caderno,
    Dado, Dedal, Disco, Despertador, Dominó,
    Escova, Espelho, Estojo, Esponja, Escada, Envelope,
    Faca, Fogão, Funil, Ferro, Furadeira, Fita,
    Garfo, Garrafa, Guarda-chuva, Gaveta, Grampeador, Geladeira,
    Hélice, Haltere, Hidrante,
    Ímã, Isqueiro, Impressora, Ioiô,
    Janela, Jarra, Joia,
    Lápis, Livro, Lâmpada, Lanterna, Lixeira, Leque,
    Mesa, Mochila, Martelo, Mala, Meia, Microfone, Moeda,
    Navalha, Notebook, Novelo,
    Óculos, Orelhão,
    Panela, Pente, Prato, Porta, Pá, Pincel, Prego,
    Quadro, Quebra-cabeça,
    Régua, Relógio, Rádio, Rodo, Rede, Raquete,
    Sofá, Sapato, Sacola, Serrote, Sino, Saleiro,
    Tesoura, Travesseiro, Toalha, Tijolo, Telefone, Tapete,
    Urna, Umidificador,
    Vaso, Vassoura, Vela, Violão, Ventilador,
    Xícara, Xilofone, Xampu,
    Zíper, Zabumba`,

  comidas: `Arroz, Almôndega, Acarajé, Angu, Azeitona,
    Bife, Batata frita, Bolo, Baião de dois, Bobó de camarão,
    Cuscuz, Coxinha, Churrasco, Canjica, Costela, Caldo verde,
    Dobradinha, Dadinho de tapioca,
    Empada, Esfiha, Estrogonofe, Escondidinho, Espaguete,
    Feijoada, Farofa, Frango, Feijão, Fricassê,
    Galinhada, Gelatina, Guisado,
    Hambúrguer, Homus,
    Iogurte, Isca de peixe,
    Jardineira,
    Lasanha, Linguiça, Lombo, Lentilha,
    Macarrão, Moqueca, Mingau, Mandioca frita,
    Nhoque, Nuggets,
    Omelete, Ovo frito,
    Pizza, Pastel, Pão de queijo, Pudim, Pamonha, Picanha,
    Quibe, Queijo, Quiche,
    Risoto, Rabada, Rocambole,
    Sopa, Sanduíche, Sushi, Salada, Salpicão, Sarapatel,
    Tapioca, Torta, Tutu de feijão, Tacacá, Torresmo,
    Umbuzada,
    Vatapá, Virado à paulista,
    Xis, Xinxim de galinha,
    Yakisoba`,

  profissoes: `Advogado, Arquiteto, Ator, Açougueiro, Agricultor, Astronauta, Atendente,
    Bombeiro, Bancário, Barbeiro, Biólogo, Bailarina, Babá,
    Cozinheiro, Cantor, Carteiro, Costureira, Contador, Cabeleireiro, Caminhoneiro,
    Dentista, Designer, Diretor, Delegado, Desenhista,
    Engenheiro, Enfermeiro, Eletricista, Escritor, Estilista, Economista,
    Fotógrafo, Farmacêutico, Faxineira, Fisioterapeuta, Frentista, Florista,
    Garçom, Geólogo, Goleiro, Gerente, Gari,
    Historiador, Hoteleiro, Humorista,
    Instrutor, Intérprete, Inspetor, Ilustrador,
    Jornalista, Jardineiro, Juiz, Joalheiro,
    Locutor, Lixeiro, Lutador, Leiloeiro,
    Médico, Motorista, Mecânico, Marceneiro, Músico, Modelo, Manicure,
    Nutricionista, Nadador, Neurologista,
    Oftalmologista, Operário, Ourives,
    Professor, Policial, Pintor, Pedreiro, Piloto, Padeiro, Psicólogo,
    Químico, Quiroprata,
    Recepcionista, Repórter, Relojoeiro, Radialista,
    Sapateiro, Secretária, Soldado, Salva-vidas, Sociólogo,
    Taxista, Tradutor, Técnico, Tenista,
    Urologista,
    Veterinário, Vendedor, Vigia, Vidraceiro, Vereador,
    Zelador, Zootecnista, Zagueiro`,

  corpo: `Antebraço, Axila, Abdômen, Artéria, Amígdala,
    Braço, Boca, Barriga, Bochecha, Bumbum, Baço,
    Cabeça, Cotovelo, Coxa, Costas, Cabelo, Coração, Canela,
    Dedo, Dente, Diafragma,
    Estômago, Esôfago, Espinha, Esterno,
    Fígado, Falange, Fêmur, Faringe,
    Garganta, Gengiva, Glúteo,
    Hálux,
    Intestino, Íris,
    Joelho,
    Língua, Lábio, Laringe,
    Mão, Mandíbula, Músculo, Mamilo,
    Nariz, Nuca, Nádega, Nervo,
    Olho, Orelha, Ombro, Osso, Omoplata, Ouvido,
    Pé, Perna, Pescoço, Pulmão, Pulso, Panturrilha, Peito,
    Queixo, Quadril,
    Rim, Rosto, Retina,
    Sobrancelha, Seio,
    Tornozelo, Testa, Tórax, Tímpano, Tíbia,
    Umbigo, Unha, Útero,
    Veia, Virilha, Vesícula`,

  adjetivos: `Amável, Alegre, Atrevida, Antipática, Animada, Ansiosa,
    Bonita, Bondosa, Brava, Barulhenta, Bagunceira,
    Chata, Carinhosa, Cheirosa, Charmosa, Ciumenta, Curiosa,
    Divertida, Doida, Dorminhoca, Dedicada, Delicada,
    Elegante, Engraçada, Esperta, Educada, Exagerada,
    Fofoqueira, Feliz, Fofa, Folgada, Fiel,
    Gentil, Gulosa, Generosa, Gritona,
    Honesta, Humilde, Habilidosa,
    Inteligente, Implicante, Irritante, Incrível,
    Jovem, Justa, Jeitosa,
    Linda, Legal, Louca, Leal,
    Maravilhosa, Mandona, Malvada, Medrosa, Meiga,
    Nervosa, Normal, Nobre,
    Ótima, Orgulhosa, Otimista,
    Preguiçosa, Perfeita, Paciente, Poderosa, Pão-dura,
    Querida, Quieta,
    Rabugenta, Risonha, Rica, Ranzinza,
    Simpática, Sincera, Sábia, Sapeca, Sonsa,
    Teimosa, Tagarela, Tímida, Tranquila, Trabalhadora,
    Única, Útil,
    Vaidosa, Valente, Vingativa,
    Zangada, Zelosa, Zen`,

  verbos: `Andar, Amar, Abrir, Ajudar, Acordar, Aprender,
    Beber, Brincar, Beijar, Bater, Buscar,
    Correr, Comer, Cantar, Cozinhar, Cair, Chorar,
    Dançar, Dormir, Dizer, Desenhar, Dirigir,
    Estudar, Escrever, Escutar, Entrar, Esperar,
    Falar, Fazer, Fugir, Fechar, Ficar,
    Gritar, Ganhar, Gostar, Gastar,
    Haver, Habitar, Hesitar,
    Ir, Imaginar, Ignorar, Inventar,
    Jogar, Jantar, Juntar, Jurar,
    Ler, Lavar, Levar, Lembrar, Limpar,
    Morar, Mandar, Mentir, Morder, Mudar,
    Nadar, Nascer, Negar, Namorar,
    Olhar, Ouvir, Ousar, Orar,
    Pular, Pensar, Pintar, Pedir, Perder,
    Querer, Quebrar, Queimar,
    Rir, Rezar, Rasgar, Reclamar,
    Sorrir, Sair, Subir, Saber, Sonhar,
    Tocar, Trabalhar, Trazer, Tomar, Tossir,
    Usar, Unir, Uivar,
    Viajar, Ver, Voar, Vender, Viver,
    Zangar, Zelar, Zoar`,

  paises: `Argentina, Alemanha, Angola, Austrália, Áustria, Afeganistão, Arábia Saudita,
    Brasil, Bolívia, Bélgica, Bulgária, Butão,
    Chile, China, Canadá, Colômbia, Cuba, Croácia, Coreia do Sul,
    Dinamarca, Djibuti,
    Espanha, Egito, Equador, Estados Unidos, Escócia, Etiópia,
    França, Finlândia, Filipinas, Fiji,
    Grécia, Guatemala, Gana, Guiana, Geórgia,
    Holanda, Honduras, Haiti, Hungria,
    Itália, Inglaterra, Índia, Irlanda, Israel, Irã, Islândia,
    Japão, Jamaica, Jordânia,
    Kuwait, Kosovo,
    Líbano, Luxemburgo, Líbia, Lituânia, Letônia,
    México, Marrocos, Moçambique, Mônaco, Mongólia,
    Noruega, Nigéria, Nepal, Nicarágua, Nova Zelândia,
    Omã,
    Portugal, Paraguai, Peru, Polônia, Panamá, Paquistão,
    Quênia, Quirguistão,
    Rússia, Romênia, Ruanda,
    Suíça, Suécia, Senegal, Síria, Sérvia, Singapura,
    Turquia, Tailândia, Tunísia, Togo,
    Uruguai, Ucrânia, Uganda, Uzbequistão,
    Venezuela, Vietnã, Vaticano,
    Zâmbia, Zimbábue`,

  estados: `Acre, Alagoas, Amapá, Amazonas, Bahia, Ceará, Espírito Santo, Goiás, Maranhão,
    Mato Grosso, Mato Grosso do Sul, Minas Gerais, Pará, Paraíba, Paraná, Pernambuco, Piauí,
    Rio de Janeiro, Rio Grande do Norte, Rio Grande do Sul, Rondônia, Roraima,
    Santa Catarina, São Paulo, Sergipe, Tocantins`,

  cidadesDoBrasil: `Aracaju, Americana, Anápolis,
    Belo Horizonte, Brasília, Belém, Blumenau,
    Curitiba, Campinas, Cuiabá, Campo Grande, Caxias do Sul,
    Diadema, Dourados, Divinópolis,
    Erechim, Extrema, Esteio,
    Fortaleza, Florianópolis, Foz do Iguaçu, Franca,
    Goiânia, Guarulhos, Gramado, Guarujá,
    Holambra, Hortolândia,
    Itajaí, Ilhéus, Ipatinga, Itu,
    João Pessoa, Joinville, Juiz de Fora, Jundiaí,
    Londrina, Lages,
    Manaus, Maceió, Maringá, Macapá,
    Natal, Niterói, Nova Iguaçu,
    Osasco, Olinda, Ouro Preto,
    Porto Alegre, Palmas, Petrópolis, Pelotas,
    Quixadá, Queimados,
    Recife, Rio de Janeiro, Ribeirão Preto, Rio Branco,
    São Paulo, Salvador, Santos, São Luís, Sorocaba,
    Teresina, Taubaté, Toledo,
    Uberlândia, Uberaba, Uruguaiana, Ubatuba,
    Vitória, Volta Redonda, Viçosa,
    Xique-Xique`,

  cidadesDoMundo: `Amsterdã, Atenas, Barcelona, Buenos Aires, Berlim, Cairo, Dublin, Dubai, Edimburgo,
    Florença, Genebra, Havana, Helsinque, Istambul, Jerusalém, Kiev, Lisboa, Londres, Lima,
    Madri, Miami, Milão, Nova York, Nápoles, Orlando, Oslo, Paris, Porto, Quito, Roma, Santiago,
    Tóquio, Toronto, Veneza, Viena, Xangai, Zurique`,

  capitais: `Aracaju, Amsterdã, Atenas, Assunção,
    Brasília, Belo Horizonte, Belém, Buenos Aires, Berlim, Bogotá, Bruxelas,
    Curitiba, Cuiabá, Campo Grande, Cairo, Caracas, Copenhague,
    Dublin, Dacar, Doha,
    Estocolmo, Edimburgo,
    Fortaleza, Florianópolis,
    Goiânia, Georgetown,
    Havana, Helsinque, Hanói,
    Islamabad,
    João Pessoa, Jacarta,
    Kiev,
    Lisboa, Londres, Lima, La Paz, Luanda,
    Manaus, Maceió, Macapá, Madri, Moscou, Montevidéu, Maputo,
    Natal, Nairóbi, Nova Délhi,
    Oslo, Ottawa,
    Porto Alegre, Palmas, Porto Velho, Paris, Pequim, Praga,
    Quito,
    Recife, Rio Branco, Roma, Riad,
    São Paulo, Salvador, São Luís, Santiago, Seul, Sófia,
    Teresina, Tóquio, Teerã, Túnis,
    Vitória, Viena, Varsóvia,
    Zagreb`,

  marcas: `Adidas, Apple, Avon, Amazon,
    Brastemp, Boticário, Bauducco, Bic, Burger King,
    Coca-Cola, Colgate, Chevrolet, Casas Bahia, Cacau Show,
    Dove, Danone, Dell, Disney,
    Elma Chips, Electrolux, Epson,
    Fiat, Ford, Faber-Castell, Fanta,
    Google, Gucci, Garoto, Gillette,
    Havaianas, Honda, Heinz, Hering,
    Ipiranga, Itaú, Intel, Ikea,
    Jeep,
    Kibon, Kopenhagen, Kia, KitKat,
    Lacta, Lego, Lacoste, LG,
    McDonald's, Mercedes, Microsoft, Motorola, Melissa,
    Nike, Nestlé, Natura, Nescau, Netflix,
    Omo, Olympikus,
    Puma, Pepsi, Perdigão, Pantene,
    Quaker,
    Renner, Riachuelo, Rolex, Ray-Ban,
    Samsung, Sadia, Sony, Seara,
    Tramontina, Toyota, Tang, Trakinas,
    Uber, Unilever,
    Volkswagen, Vivo, Visa,
    Xiaomi, Xbox,
    Yakult, YouTube,
    Zara`,

  filmesSeriesDesenhos: `Avatar, Aladdin, Alien,
    Barbie, Batman, Bob Esponja, Breaking Bad, Branca de Neve,
    Carros, Cinderela, Coringa, Chaves, Cidade de Deus,
    Dumbo, Divertida Mente, Dexter, Dragon Ball,
    Encanto, Enrolados, Elementos,
    Frozen, Friends, Fuga das Galinhas, Família Dinossauro,
    Gladiador, Godzilla, Garfield, Gravity Falls,
    Harry Potter, Hulk, Homem-Aranha, Hércules,
    Interestelar, Irmão Urso,
    Jurassic Park, Jumanji, Jogos Vorazes,
    King Kong, Kung Fu Panda,
    Lilo e Stitch, La Casa de Papel, Lost, Luca,
    Moana, Mulan, Matrix, Madagascar, Minions,
    Naruto, Nárnia,
    Os Simpsons, Os Vingadores,
    Procurando Nemo, Pokémon, Peppa Pig, Pinóquio, Piratas do Caribe,
    Quarteto Fantástico,
    Ratatouille, Rocky, Rio, Rei Leão,
    Shrek, Star Wars, Stranger Things, Superman, Scooby-Doo,
    Titanic, Toy Story, Tarzan, Thor, Turma da Mônica,
    Up,
    Velozes e Furiosos, Valente, Viva,
    Wandinha, WALL-E,
    X-Men,
    Zootopia, Zorro`,

  bebidas: `Água, Água de coco, Achocolatado,
    Batida,
    Café, Cerveja, Chá, Caipirinha, Cachaça, Chocolate quente, Champanhe,
    Daiquiri,
    Energético, Espumante,
    Fernet,
    Guaraná, Gin, Groselha, Garapa,
    Hidromel,
    Isotônico,
    Jurubeba,
    Kefir,
    Leite, Limonada, Licor,
    Mate, Milk-shake, Mojito, Margarita,
    Néctar,
    Pinga, Ponche, Pisco,
    Quentão,
    Refrigerante, Rum,
    Suco, Saquê, Sangria, Smoothie,
    Tequila, Tereré, Tubaína,
    Uísque,
    Vinho, Vodca, Vitamina`,

  doces: `Arroz-doce, Algodão-doce, Ambrosia, Alfajor,
    Brigadeiro, Beijinho, Bombom, Bolo, Bala,
    Cocada, Chocolate, Cajuzinho, Canjica, Churros, Cheesecake,
    Doce de leite, Donut, Doce de abóbora,
    Flan, Fios de ovos,
    Goiabada, Gelatina, Geleia,
    Jujuba,
    Mousse, Manjar, Merengue, Mil-folhas, Marshmallow,
    Nega maluca,
    Pudim, Pé de moleque, Paçoca, Pavê, Petit gâteau, Pirulito,
    Quindim, Queijadinha,
    Rapadura, Rocambole,
    Sorvete, Sagu, Suspiro, Sonho,
    Torta, Trufa, Tiramisu`,

  times: `Atlético Mineiro, Athletico Paranaense, Avaí, América Mineiro, Ajax, Arsenal,
    Botafogo, Bahia, Bragantino, Barcelona, Bayern de Munique,
    Corinthians, Cruzeiro, Coritiba, Ceará, Chapecoense, Chelsea,
    Flamengo, Fluminense, Fortaleza, Figueirense,
    Grêmio, Goiás, Guarani,
    Internacional, Inter de Milão, Ituano,
    Juventude, Juventus,
    Liverpool, Londrina,
    Manchester United, Milan, Mirassol,
    Náutico, Napoli,
    Palmeiras, Ponte Preta, Paysandu,
    Real Madrid, Remo, Roma,
    Santos, São Paulo, Sport,
    Vasco, Vitória, Vila Nova`,

  transportes: `Avião, Ambulância, Asa-delta,
    Bicicleta, Barco, Balão, Bonde,
    Carro, Caminhão, Canoa, Charrete, Carroça,
    Dirigível,
    Elevador, Escuna,
    Foguete, Funicular,
    Helicóptero,
    Iate,
    Jangada, Jet ski, Jipe,
    Lancha, Limusine,
    Moto, Metrô, Monotrilho,
    Navio, Nave espacial,
    Ônibus,
    Patinete, Patins, Planador,
    Quadriciclo,
    Riquixá,
    Skate, Submarino,
    Trem, Táxi, Trator, Teleférico, Triciclo,
    Ultraleve,
    Veleiro, Van,
    Zepelim`,

  idiomas: `Alemão, Árabe, Africâner,
    Basco, Búlgaro, Bengali,
    Chinês, Catalão, Coreano, Croata,
    Dinamarquês,
    Espanhol, Esperanto, Estoniano,
    Francês, Finlandês,
    Grego, Guarani, Galego,
    Hebraico, Holandês, Húngaro, Hindi,
    Inglês, Italiano, Islandês, Iorubá,
    Japonês,
    Latim, Libras,
    Mandarim,
    Norueguês, Nepalês,
    Português, Polonês, Persa,
    Quíchua,
    Russo, Romeno,
    Sueco, Suaíli, Sérvio,
    Tupi, Turco, Tailandês,
    Ucraniano, Urdu,
    Vietnamita`,
};

const LISTAS = {
  nomes: lista(TEXTO.nomes),
  animais: lista(TEXTO.animais),
  cores: lista(TEXTO.cores),
  frutas: lista(TEXTO.frutas),
  legumes: lista(TEXTO.legumes),
  flv: lista(TEXTO.frutas, TEXTO.legumes),
  objetos: lista(TEXTO.objetos),
  comidas: lista(TEXTO.comidas),
  profissoes: lista(TEXTO.profissoes),
  corpo: lista(TEXTO.corpo),
  adjetivos: lista(TEXTO.adjetivos),
  verbos: lista(TEXTO.verbos),
  paises: lista(TEXTO.paises),
  estados: lista(TEXTO.estados),
  cidadesDoBrasil: lista(TEXTO.cidadesDoBrasil),
  cidades: lista(TEXTO.cidadesDoBrasil, TEXTO.cidadesDoMundo),
  capitais: lista(TEXTO.capitais),
  cep: lista(TEXTO.cidadesDoBrasil, TEXTO.estados, TEXTO.paises, TEXTO.cidadesDoMundo),
  marcas: lista(TEXTO.marcas),
  filmesSeriesDesenhos: lista(TEXTO.filmesSeriesDesenhos),
  bebidas: lista(TEXTO.bebidas),
  doces: lista(TEXTO.doces),
  times: lista(TEXTO.times),
  transportes: lista(TEXTO.transportes),
  idiomas: lista(TEXTO.idiomas),
};

export type NomeDaLista = keyof typeof LISTAS;

/**
 * Qual lista serve para a categoria. Primeiro procura pelas palavras do nome
 * ("Fruta/Verdura/Legume", "Cidade do Brasil", "Parte do corpo"…); sem nenhuma, o robô
 * não conhece a categoria e deixa em branco (a IA cobre o resto).
 */
export function listaDaCategoria(categoria: string): NomeDaLista | null {
  const palavras = normalizar(categoria).split(' ');
  const tem = (...chaves: string[]) => chaves.some((c) => palavras.includes(c));
  const comeca = (...chaves: string[]) => chaves.some((c) => palavras.some((p) => p.startsWith(c)));

  if (tem('fruta', 'frutas') && comeca('verdura', 'legume', 'flv')) return 'flv';
  if (tem('flv')) return 'flv';
  if (tem('fruta', 'frutas')) return 'frutas';
  if (comeca('verdura', 'legume')) return 'legumes';
  if (tem('filme') && comeca('serie', 'desenho')) return 'filmesSeriesDesenhos';
  if (tem('corpo')) return 'corpo';
  if (tem('cor', 'cores')) return 'cores';
  if (comeca('animal', 'animais', 'bicho')) return 'animais';
  if (tem('cep')) return 'cep';
  if (comeca('capita')) return 'capitais';
  if (comeca('cidade')) return tem('brasil') ? 'cidadesDoBrasil' : 'cidades';
  if (tem('pais', 'paises')) return 'paises';
  if (tem('estado', 'estados')) return 'estados';
  if (tem('time', 'times', 'futebol')) return 'times';
  if (comeca('transporte', 'veiculo')) return 'transportes';
  if (comeca('idioma')) return 'idiomas';
  if (comeca('profiss')) return 'profissoes';
  if (comeca('objeto')) return 'objetos';
  if (comeca('bebida')) return 'bebidas';
  if (comeca('doce', 'sobremesa')) return 'doces';
  if (comeca('comida', 'prato')) return 'comidas';
  if (comeca('marca')) return 'marcas';
  if (tem('mse', 'sogra') || comeca('adjetivo')) return 'adjetivos';
  if (comeca('verbo')) return 'verbos';
  if (comeca('nome')) return 'nomes';
  return null;
}

/** Palavras da lista que começam com a letra, da mais comum para a mais rara. */
export function palavrasDaLista(nome: NomeDaLista, letra: string): string[] {
  return LISTAS[nome].porLetra.get(letra.toUpperCase()) ?? [];
}

/** Todas as listas, para os testes conferirem as palavras. */
export function todasAsListas(): Record<NomeDaLista, Map<string, string[]>> {
  return Object.fromEntries(Object.entries(LISTAS).map(([nome, l]) => [nome, l.porLetra])) as Record<
    NomeDaLista,
    Map<string, string[]>
  >;
}

/** O cérebro sem IA: só as listas acima. Não sabe julgar o que não está nelas. */
export class CerebroDePalavras implements Cerebro {
  situacao(): SituacaoCerebro {
    return { ia: false };
  }

  async pensar(letra: string, categorias: string[]): Promise<string[][]> {
    return categorias.map((categoria) => {
      const nome = listaDaCategoria(categoria);
      return nome ? limparOpcoes(palavrasDaLista(nome, letra), letra) : [];
    });
  }

  async julgar(_letra: string, respostas: RespostaParaJulgar[]): Promise<(boolean | null)[]> {
    return respostas.map(({ categoria, texto }) => {
      const nome = listaDaCategoria(categoria);
      return nome && LISTAS[nome].chaves.has(chaveResposta(texto)) ? true : null;
    });
  }
}
