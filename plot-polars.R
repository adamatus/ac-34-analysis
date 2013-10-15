library(plotrix)
library(RColorBrewer)
polars <- read.csv('data/AC-72 Polar.csv')
pal <- brewer.pal(5,'Set1')

step <- 30

for (i in 1:5)
{
  angles <- c(0,polars[i,seq(3,11,2)]*pi/180, 2*pi-(rev(polars[i,seq(3,9,2)]*pi/180))) 
  speeds <- c(0,polars[i,seq(2,11,2)], rev(polars[i,seq(2,9,2)]))
  radial.plot(as.numeric(speeds),as.numeric(angles),
              start=pi/2,
              rp.type='p',
              radial.lim=c(0,55),
              add=ifelse(i==1,F,T),
              line.col=pal[i],
              labels=c(seq(0,180,step),rev(seq(step,180-step,step))),
              labels.pos = seq(0,360-step,step)*pi/180)
}