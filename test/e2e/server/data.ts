/**
 * Sample dinosaur data for the mock server
 * Based on RESTasaurus API structure
 */

export interface Dinosaur {
  id: number;
  name: string;
  description: string;
  diet: 'herbivore' | 'carnivore' | 'omnivore';
  period: string;
  lived: string;
  type: string;
  length: string;
  weight: string;
  taxonomy: {
    clade: string;
    family: string;
  };
  namedBy: string;
  image?: string;
}

export const dinosaurs: Dinosaur[] = [
  {
    id: 1,
    name: 'Tyrannosaurus Rex',
    description: 'One of the largest land predators of all time, with powerful jaws and tiny arms.',
    diet: 'carnivore',
    period: 'Late Cretaceous',
    lived: '68-66 million years ago',
    type: 'large theropod',
    length: '12.3 meters',
    weight: '8,400 kg',
    taxonomy: {
      clade: 'Theropoda',
      family: 'Tyrannosauridae'
    },
    namedBy: 'Henry Fairfield Osborn, 1905',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/94/Tyrannosaurus_Rex_Holotype.jpg'
  },
  {
    id: 2,
    name: 'Velociraptor',
    description: 'A small, swift predator with a large sickle-shaped claw on each foot.',
    diet: 'carnivore',
    period: 'Late Cretaceous',
    lived: '75-71 million years ago',
    type: 'small theropod',
    length: '2 meters',
    weight: '15 kg',
    taxonomy: {
      clade: 'Theropoda',
      family: 'Dromaeosauridae'
    },
    namedBy: 'Henry Fairfield Osborn, 1924',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Velociraptor_Restoration.png'
  },
  {
    id: 3,
    name: 'Triceratops',
    description: 'A large herbivore with three horns and a bony frill protecting its neck.',
    diet: 'herbivore',
    period: 'Late Cretaceous',
    lived: '68-66 million years ago',
    type: 'ceratopsian',
    length: '9 meters',
    weight: '6,000 kg',
    taxonomy: {
      clade: 'Ceratopsia',
      family: 'Ceratopsidae'
    },
    namedBy: 'Othniel Charles Marsh, 1889'
  },
  {
    id: 4,
    name: 'Brachiosaurus',
    description: 'A massive sauropod with front legs longer than its back legs, giving it a giraffe-like stance.',
    diet: 'herbivore',
    period: 'Late Jurassic',
    lived: '154-150 million years ago',
    type: 'sauropod',
    length: '26 meters',
    weight: '56,000 kg',
    taxonomy: {
      clade: 'Sauropoda',
      family: 'Brachiosauridae'
    },
    namedBy: 'Elmer S. Riggs, 1903'
  },
  {
    id: 5,
    name: 'Stegosaurus',
    description: 'A large herbivore known for its distinctive plates along its back and spiked tail.',
    diet: 'herbivore',
    period: 'Late Jurassic',
    lived: '155-150 million years ago',
    type: 'stegosaurian',
    length: '9 meters',
    weight: '5,000 kg',
    taxonomy: {
      clade: 'Thyreophora',
      family: 'Stegosauridae'
    },
    namedBy: 'Othniel Charles Marsh, 1877'
  },
  {
    id: 6,
    name: 'Spinosaurus',
    description: 'The largest known carnivorous dinosaur, with a distinctive sail on its back.',
    diet: 'carnivore',
    period: 'Late Cretaceous',
    lived: '99-93.5 million years ago',
    type: 'large theropod',
    length: '15 meters',
    weight: '7,400 kg',
    taxonomy: {
      clade: 'Theropoda',
      family: 'Spinosauridae'
    },
    namedBy: 'Ernst Stromer, 1915'
  },
  {
    id: 7,
    name: 'Ankylosaurus',
    description: 'A heavily armored herbivore with a club-like tail used for defense.',
    diet: 'herbivore',
    period: 'Late Cretaceous',
    lived: '68-66 million years ago',
    type: 'ankylosaur',
    length: '8 meters',
    weight: '6,000 kg',
    taxonomy: {
      clade: 'Thyreophora',
      family: 'Ankylosauridae'
    },
    namedBy: 'Barnum Brown, 1908'
  },
  {
    id: 8,
    name: 'Pteranodon',
    description: 'A large flying reptile (pterosaur) with a distinctive backward-pointing crest.',
    diet: 'carnivore',
    period: 'Late Cretaceous',
    lived: '86-84.5 million years ago',
    type: 'pterosaur',
    length: '1.8 meters (body)',
    weight: '25 kg',
    taxonomy: {
      clade: 'Pterosauria',
      family: 'Pteranodontidae'
    },
    namedBy: 'Othniel Charles Marsh, 1876'
  },
  {
    id: 9,
    name: 'Diplodocus',
    description: 'One of the longest dinosaurs, with an extremely long neck and whip-like tail.',
    diet: 'herbivore',
    period: 'Late Jurassic',
    lived: '154-152 million years ago',
    type: 'sauropod',
    length: '32 meters',
    weight: '16,000 kg',
    taxonomy: {
      clade: 'Sauropoda',
      family: 'Diplodocidae'
    },
    namedBy: 'Othniel Charles Marsh, 1878'
  },
  {
    id: 10,
    name: 'Parasaurolophus',
    description: 'A hadrosaurid known for its long, backward-curving cranial crest used for communication.',
    diet: 'herbivore',
    period: 'Late Cretaceous',
    lived: '76.5-73 million years ago',
    type: 'hadrosaurid',
    length: '10 meters',
    weight: '2,500 kg',
    taxonomy: {
      clade: 'Ornithopoda',
      family: 'Hadrosauridae'
    },
    namedBy: 'William Parks, 1922'
  }
];

export const diets = ['herbivore', 'carnivore', 'omnivore'] as const;

export const clades = [
  'Theropoda',
  'Sauropoda',
  'Ceratopsia',
  'Thyreophora',
  'Ornithopoda',
  'Pterosauria'
] as const;

export const periods = [
  'Late Cretaceous',
  'Early Cretaceous',
  'Late Jurassic',
  'Middle Jurassic',
  'Early Jurassic',
  'Late Triassic'
] as const;
