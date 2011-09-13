MongoPop
========

Nifty Node.js+MongoDB demo, originally written by `@seb_m <https://twitter.com/#!/seb_m/status/112165857697869825>`_.

To deploy it on DotCloud::

  git clone git://github.com/jpetazzo/MongoPop.git
  dotcloud push mongopop MongoPop

Note that you have to wait a few minutes for the MongoDB instance to be ready (it preallocates a few gigabytes of space, which takes some time). Forthcoming version of the MongoDB service on DotCloud will deploy faster, but meanwhile, give it some time :-)
