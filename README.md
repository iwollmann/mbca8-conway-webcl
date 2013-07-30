mbca8-conway-webcl
==================

Implementação do jogo da vida usando WebCL

"O jogo da vida é um autómato celular desenvolvido pelo matemático britânico John Horton Conway em 1970." Para maiores detalhes: http://pt.wikipedia.org/wiki/Jogo_da_vida

Célula preta é a viva e a célula branca é a morta.

Regras do jogo:
Qualquer célula viva com menos de dois vizinhos vivos morre de solidão.
Qualquer célula viva com mais de três vizinhos vivos morre de superpopulação.
Qualquer célula morta com exatamente três vizinhos vivos se torna uma célula viva.
Qualquer célula viva com dois ou três vizinhos vivos continua no mesmo estado para a próxima geração.


A ideia é utilizar WebCL para paralelizar o processamento do algoritmo.

WebCL
================

É uma API que consegue fazer ligação direta com o OpenCL através da javascript.
O grupo responsável pelo seu desenvolvimento é o Khronos Group (http://www.khronos.org/webcl/).

Informações de como rodar o WebCL na página inicial do nokia research em Getting Started:
http://webcl.nokiaresearch.com/index.html


Exemplos
=================
Implementação sem o WebCL: www.codinginsideout.com.br/samples/conway/no-webcl.html
Implementação com o WebCL: www.codinginsideout.com.br/samples/conway/webcl.html

Créditos para a montagem do grid: http://css-tricks.com/drawing-table
